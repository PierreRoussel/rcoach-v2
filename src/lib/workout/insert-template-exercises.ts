import type { NhostClient } from '@nhost/nhost-js'

import {
  INSERT_WORKOUT_TEMPLATE_EXERCISES,
  INSERT_WORKOUT_TEMPLATE_SETS,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import { buildTemplateExerciseInsertObjects } from '@/lib/workout/template-insert'

type TemplateExerciseInsertInput = Parameters<
  typeof buildTemplateExerciseInsertObjects
>[1]

type InsertedTemplateExercise = {
  id: string
  sort_order: number
}

type ExerciseInsertOptions = {
  includeSupersetId?: boolean
  includeDefaultRestSeconds?: boolean
}

const FULL_EXERCISE_INSERT_OPTIONS: ExerciseInsertOptions = {
  includeSupersetId: true,
  includeDefaultRestSeconds: true,
}

function buildExerciseRows(
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  options?: ExerciseInsertOptions,
) {
  return buildTemplateExerciseInsertObjects(templateId, exercises, options).map(
    ({ workout_template_sets: _sets, ...exercise }) => exercise,
  )
}

function buildNestedExerciseRows(
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  options?: ExerciseInsertOptions,
) {
  return buildTemplateExerciseInsertObjects(templateId, exercises, options).map(
    (exercise) => {
      const nestedSets = exercise.workout_template_sets as {
        data: Array<{
          set_index: number
          weight_kg: number | null
          reps: number | null
          rest_seconds: number
        }>
      }

      return {
        ...exercise,
        workout_template_sets: {
          data: nestedSets.data.map((set) => ({
            ...set,
            rest_seconds: Math.max(0, Math.round(set.rest_seconds ?? 90)),
          })),
        },
      }
    },
  )
}

function buildSetRows(
  insertedExercises: InsertedTemplateExercise[],
  exercises: TemplateExerciseInsertInput,
  defaultRestSeconds: number,
) {
  const insertedBySortOrder = new Map(
    insertedExercises.map((exercise) => [exercise.sort_order, exercise]),
  )

  const rows: Array<{
    template_exercise_id: string
    set_index: number
    weight_kg: number | null
    reps: number | null
    rest_seconds: number
  }> = []

  for (let sortOrder = 0; sortOrder < exercises.length; sortOrder += 1) {
    const inserted = insertedBySortOrder.get(sortOrder)
    const exercise = exercises[sortOrder]
    if (!inserted || !exercise) {
      continue
    }

    for (const set of exercise.sets) {
      const restSeconds = Math.max(
        0,
        Math.round(
          set.usesGlobalRest
            ? exercise.defaultRestSeconds ?? defaultRestSeconds
            : set.restSeconds ?? exercise.defaultRestSeconds ?? defaultRestSeconds,
        ),
      )

      rows.push({
        template_exercise_id: inserted.id,
        set_index: set.setIndex,
        weight_kg: set.weightKg,
        reps: set.reps,
        rest_seconds: restSeconds,
      })
    }
  }

  return rows
}

async function insertExercises(
  nhost: NhostClient,
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  options?: ExerciseInsertOptions,
) {
  const data = await graphqlRequest<{
    insert_workout_template_exercises: {
      returning: InsertedTemplateExercise[]
    }
  }>(nhost, INSERT_WORKOUT_TEMPLATE_EXERCISES, {
    objects: buildExerciseRows(templateId, exercises, options),
  })

  return data.insert_workout_template_exercises.returning
}

async function insertExercisesWithNestedSets(
  nhost: NhostClient,
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  options?: ExerciseInsertOptions,
) {
  await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_EXERCISES, {
    objects: buildNestedExerciseRows(templateId, exercises, options),
  })
}

async function insertSets(
  nhost: NhostClient,
  insertedExercises: InsertedTemplateExercise[],
  exercises: TemplateExerciseInsertInput,
  defaultRestSeconds: number,
) {
  const objects = buildSetRows(insertedExercises, exercises, defaultRestSeconds)
  if (objects.length === 0) {
    return
  }

  await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_SETS, { objects })
}

function degradeExerciseInsertOptions(
  error: unknown,
  options: ExerciseInsertOptions,
): ExerciseInsertOptions | null {
  if (
    options.includeDefaultRestSeconds &&
    isGraphqlMissingFieldError(error, 'default_rest_seconds')
  ) {
    return { ...options, includeDefaultRestSeconds: false }
  }

  if (options.includeSupersetId && isGraphqlMissingFieldError(error, 'superset_id')) {
    return { ...options, includeSupersetId: false }
  }

  return null
}

async function insertWithDegradingOptions(
  attempt: (
    options: ExerciseInsertOptions,
  ) => Promise<void>,
  initialOptions: ExerciseInsertOptions = FULL_EXERCISE_INSERT_OPTIONS,
) {
  let options = { ...initialOptions }
  let lastError: unknown

  for (let attemptIndex = 0; attemptIndex < 4; attemptIndex += 1) {
    try {
      await attempt(options)
      return
    } catch (error) {
      lastError = error

      const nextOptions = degradeExerciseInsertOptions(error, options)
      if (!nextOptions) {
        break
      }

      options = nextOptions
    }
  }

  throw lastError
}

async function insertWithFlatSets(
  nhost: NhostClient,
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  defaultRestSeconds: number,
) {
  try {
    await insertWithDegradingOptions(async (options) => {
      const inserted = await insertExercises(nhost, templateId, exercises, options)
      await insertSets(nhost, inserted, exercises, defaultRestSeconds)
    })
  } catch (error) {
    await insertWithDegradingOptions(async (options) => {
      await insertExercisesWithNestedSets(nhost, templateId, exercises, options)
    })
    return
  }
}

export async function insertTemplateExercises(
  nhost: NhostClient,
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  defaultRestSeconds = 90,
) {
  if (exercises.length === 0) {
    return
  }

  await insertWithFlatSets(nhost, templateId, exercises, defaultRestSeconds)
}
