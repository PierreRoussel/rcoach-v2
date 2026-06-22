import type { NhostClient } from '@nhost/nhost-js'

import {
  INSERT_WORKOUT_TEMPLATE,
  UPDATE_WORKOUT_TEMPLATE_SOURCE,
  type WorkoutTemplate,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  isGraphqlDatabaseError,
  isGraphqlMissingFieldError,
} from '@/lib/graphql/schema-errors'

type InsertWorkoutTemplateInput = {
  name: string
  defaultRestSeconds: number
  sourceWorkoutId?: string | null
}

async function tryInsertTemplate(
  nhost: NhostClient,
  object: Record<string, unknown>,
): Promise<WorkoutTemplate | null> {
  const data = await graphqlRequest<{
    insert_workout_templates_one: WorkoutTemplate | null
  }>(nhost, INSERT_WORKOUT_TEMPLATE, { object })

  return data.insert_workout_templates_one
}

export async function insertWorkoutTemplateWithFallbacks(
  nhost: NhostClient,
  input: InsertWorkoutTemplateInput,
): Promise<WorkoutTemplate> {
  const attempts: Array<Record<string, unknown>> = [{ name: input.name }]

  if (Number.isFinite(input.defaultRestSeconds)) {
    attempts.push({
      name: input.name,
      default_rest_seconds: Math.round(input.defaultRestSeconds),
    })
  }

  let lastError: unknown

  for (const object of attempts) {
    try {
      const template = await tryInsertTemplate(nhost, object)
      if (!template?.id) {
        throw new Error('Creation du modele impossible.')
      }

      if (input.sourceWorkoutId) {
        await linkTemplateToSourceWorkout(nhost, template.id, input.sourceWorkoutId)
      }

      return template
    } catch (error) {
      lastError = error

      const canRetry =
        object.default_rest_seconds != null &&
        (isGraphqlMissingFieldError(error, 'default_rest_seconds') ||
          isGraphqlDatabaseError(error))

      if (!canRetry) {
        throw error
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Creation du modele impossible.')
}

async function linkTemplateToSourceWorkout(
  nhost: NhostClient,
  templateId: string,
  sourceWorkoutId: string,
) {
  try {
    await graphqlRequest(nhost, UPDATE_WORKOUT_TEMPLATE_SOURCE, {
      id: templateId,
      sourceWorkoutId,
    })
  } catch (error) {
    if (isGraphqlMissingFieldError(error, 'source_workout_id')) {
      return
    }

    if (isGraphqlDatabaseError(error)) {
      return
    }

    throw error
  }
}
