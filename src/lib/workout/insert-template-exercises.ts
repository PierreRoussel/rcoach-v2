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
) {
  if (exercises.length === 0) {
    return
  }

  const withAllFields = buildTemplateExerciseInsertObjects(templateId, exercises, {
    includeSupersetId: true,
    includeDefaultRestSeconds: true,
  })

  try {
    await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_EXERCISES, {
      objects: withAllFields,
    })
    return
  } catch (error) {
    if (!isGraphqlMissingFieldError(error, 'superset_id')) {
      if (!isGraphqlMissingFieldError(error, 'default_rest_seconds')) {
        throw error
      }

      const withoutDefaultRest = buildTemplateExerciseInsertObjects(
        templateId,
        exercises,
        { includeSupersetId: true, includeDefaultRestSeconds: false },
      )

      try {
        await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_EXERCISES, {
          objects: withoutDefaultRest,
        })
        return
      } catch (innerError) {
        if (!isGraphqlMissingFieldError(innerError, 'superset_id')) {
          throw innerError
        }
      }
    }
  }

  await graphqlRequest(nhost, INSERT_WORKOUT_TEMPLATE_EXERCISES, {
    objects: buildTemplateExerciseInsertObjects(templateId, exercises, {
      includeSupersetId: false,
      includeDefaultRestSeconds: false,
    }),
  })
}
