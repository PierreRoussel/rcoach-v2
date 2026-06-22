import type { NhostClient } from '@nhost/nhost-js'

import { INSERT_WORKOUT_TEMPLATE_EXERCISES } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import { buildTemplateExerciseInsertObjects } from '@/lib/workout/template-insert'

type TemplateExerciseInsertInput = Parameters<
  typeof buildTemplateExerciseInsertObjects
>[1]

export async function insertTemplateExercises(
  nhost: NhostClient,
  templateId: string,
  exercises: TemplateExerciseInsertInput,
  defaultRestSeconds: number,
) {
  if (exercises.length === 0) {
    return
  }

  const withSupersets = buildTemplateExerciseInsertObjects(
    templateId,
    exercises,
    defaultRestSeconds,
    { includeSupersetId: true },
  )

  try {
    await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_EXERCISES, {
      objects: withSupersets,
    })
    return
  } catch (error) {
    if (!isGraphqlMissingFieldError(error, 'superset_id')) {
      throw error
    }
  }

  await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_EXERCISES, {
    objects: buildTemplateExerciseInsertObjects(
      templateId,
      exercises,
      defaultRestSeconds,
      { includeSupersetId: false },
    ),
  })
}
