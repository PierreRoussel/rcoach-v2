import type { NhostClient } from '@nhost/nhost-js'

import {
  INSERT_WORKOUT_TEMPLATE,
  UPDATE_WORKOUT_TEMPLATE,
  UPDATE_WORKOUT_TEMPLATE_SOURCE,
  type WorkoutTemplate,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  isGraphqlDatabaseError,
  isGraphqlMissingFieldError,
} from '@/lib/graphql/schema-errors'
import { normalizeSessionMode, type SessionMode } from '@/lib/workout/session-mode'

type InsertWorkoutTemplateInput = {
  name: string
  defaultRestSeconds: number
  sourceWorkoutId?: string | null
  sessionMode?: SessionMode
  emomIntervalSeconds?: number | null
  emomTotalMinutes?: number | null
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

function buildInsertAttempts(input: InsertWorkoutTemplateInput): Array<Record<string, unknown>> {
  const sessionMode = normalizeSessionMode(input.sessionMode)
  const attempts: Array<Record<string, unknown>> = [{ name: input.name }]

  const withRest = {
    name: input.name,
    default_rest_seconds: Math.round(input.defaultRestSeconds),
  }

  attempts.push(withRest)

  if (sessionMode === 'emom') {
    attempts.push({
      ...withRest,
      session_mode: sessionMode,
      emom_interval_seconds: input.emomIntervalSeconds ?? 60,
      emom_total_minutes: input.emomTotalMinutes ?? 12,
    })
  } else {
    attempts.push({
      ...withRest,
      session_mode: 'circuit',
    })
  }

  return attempts
}

export async function insertWorkoutTemplateWithFallbacks(
  nhost: NhostClient,
  input: InsertWorkoutTemplateInput,
): Promise<WorkoutTemplate> {
  const attempts = buildInsertAttempts(input)
  let lastError: unknown

  for (const object of attempts) {
    try {
      const template = await tryInsertTemplate(nhost, object)
      if (!template?.id) {
        throw new Error('Création du modèle impossible.')
      }

      if (input.sourceWorkoutId) {
        await linkTemplateToSourceWorkout(nhost, template.id, input.sourceWorkoutId)
      }

      const needsSessionPatch =
        normalizeSessionMode(input.sessionMode) === 'emom' &&
        object.session_mode == null

      if (needsSessionPatch) {
        await patchTemplateSessionMode(nhost, template.id, input)
      }

      return template
    } catch (error) {
      lastError = error

      const canRetry =
        (object.default_rest_seconds != null &&
          (isGraphqlMissingFieldError(error, 'default_rest_seconds') ||
            isGraphqlDatabaseError(error))) ||
        (object.session_mode != null &&
          (isGraphqlMissingFieldError(error, 'session_mode') ||
            isGraphqlMissingFieldError(error, 'emom_interval_seconds') ||
            isGraphqlMissingFieldError(error, 'emom_total_minutes')))

      if (!canRetry) {
        throw error
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Création du modèle impossible.')
}

async function patchTemplateSessionMode(
  nhost: NhostClient,
  templateId: string,
  input: InsertWorkoutTemplateInput,
) {
  if (normalizeSessionMode(input.sessionMode) !== 'emom') {
    return
  }

  try {
    await graphqlRequest(nhost, UPDATE_WORKOUT_TEMPLATE, {
      id: templateId,
      name: input.name,
      folderName: null,
      defaultRestSeconds: Math.round(input.defaultRestSeconds),
      sessionMode: 'emom',
      emomIntervalSeconds: input.emomIntervalSeconds ?? 60,
      emomTotalMinutes: input.emomTotalMinutes ?? 12,
    })
  } catch (error) {
    if (
      isGraphqlMissingFieldError(error, 'session_mode') ||
      isGraphqlMissingFieldError(error, 'emom_interval_seconds') ||
      isGraphqlMissingFieldError(error, 'emom_total_minutes')
    ) {
      return
    }

    throw error
  }
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
