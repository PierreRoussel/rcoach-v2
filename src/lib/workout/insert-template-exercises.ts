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

type TemplateInsertOptions = {
  includeSupersetId?: boolean
  includeEmomGroupId?: boolean
  includeTargetReps?: boolean
  includeDefaultRestSeconds?: boolean
  includeSetType?: boolean
  includeDurationSeconds?: boolean
}

const FULL_TEMPLATE_INSERT_OPTIONS: TemplateInsertOptions = {
  includeSupersetId: true,
  includeEmomGroupId: true,
  includeTargetReps: true,
  includeDefaultRestSeconds: true,
  includeSetType: true,
  includeDurationSeconds: true,
}

function buildExerciseRows(
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  options?: TemplateInsertOptions,
) {
  return buildTemplateExerciseInsertObjects(templateId, exercises, options).map(
    ({ workout_template_sets, ...exercise }) => {
      void workout_template_sets
      return exercise
    },
  )
}

function buildNestedExerciseRows(
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  options?: TemplateInsertOptions,
) {
  return buildTemplateExerciseInsertObjects(templateId, exercises, options).map(
    (exercise) => {
      const nestedSets = exercise.workout_template_sets as {
        data: Array<{
          set_index: number
          weight_kg: number | null
          reps: number | null
          rest_seconds: number
          set_type?: string
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
  options?: TemplateInsertOptions,
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
    set_type?: string
    duration_seconds?: number | null
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

      const row: (typeof rows)[number] = {
        template_exercise_id: inserted.id,
        set_index: set.setIndex,
        weight_kg: set.weightKg,
        reps: set.reps,
        rest_seconds: restSeconds,
      }

      if (options?.includeSetType) {
        row.set_type = set.setType ?? 'normal'
      }

      if (options?.includeDurationSeconds && set.durationSeconds != null) {
        row.duration_seconds = set.durationSeconds
      }

      rows.push(row)
    }
  }

  return rows
}

async function insertExercises(
  nhost: NhostClient,
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  options?: TemplateInsertOptions,
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
  options?: TemplateInsertOptions,
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
  options?: TemplateInsertOptions,
) {
  const objects = buildSetRows(
    insertedExercises,
    exercises,
    defaultRestSeconds,
    options,
  )
  if (objects.length === 0) {
    return
  }

  await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_SETS, { objects })
}

function degradeTemplateInsertOptions(
  error: unknown,
  options: TemplateInsertOptions,
): TemplateInsertOptions | null {
  if (
    options.includeDefaultRestSeconds &&
    isGraphqlMissingFieldError(error, 'default_rest_seconds')
  ) {
    return { ...options, includeDefaultRestSeconds: false }
  }

  if (options.includeSupersetId && isGraphqlMissingFieldError(error, 'superset_id')) {
    return { ...options, includeSupersetId: false }
  }

  if (options.includeEmomGroupId && isGraphqlMissingFieldError(error, 'emom_group_id')) {
    return { ...options, includeEmomGroupId: false }
  }

  if (options.includeTargetReps && isGraphqlMissingFieldError(error, 'target_reps')) {
    return { ...options, includeTargetReps: false }
  }

  if (options.includeSetType && isGraphqlMissingFieldError(error, 'set_type')) {
    return { ...options, includeSetType: false }
  }

  if (
    options.includeDurationSeconds &&
    isGraphqlMissingFieldError(error, 'duration_seconds')
  ) {
    return { ...options, includeDurationSeconds: false }
  }

  return null
}

async function insertWithDegradingOptions(
  attempt: (options: TemplateInsertOptions) => Promise<void>,
  initialOptions: TemplateInsertOptions = FULL_TEMPLATE_INSERT_OPTIONS,
) {
  let options = { ...initialOptions }
  let lastError: unknown

  for (let attemptIndex = 0; attemptIndex < 5; attemptIndex += 1) {
    try {
      await attempt(options)
      return
    } catch (error) {
      lastError = error

      const nextOptions = degradeTemplateInsertOptions(error, options)
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
      await insertSets(nhost, inserted, exercises, defaultRestSeconds, options)
    })
  } catch {
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
