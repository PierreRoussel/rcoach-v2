import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  DEFAULT_GLOBAL_REST_SECONDS,
  templateToDraft,
} from '@/hooks/useWorkoutTemplates'
import {
  DELETE_WORKOUT_TEMPLATE,
  ENABLE_TEMPLATE_SHARE,
  GET_SHARED_TEMPLATE_BY_TOKEN,
  type SharedWorkoutTemplate,
  type WorkoutTemplate,
} from '@/lib/graphql/operations'
import { publicGraphqlRequest } from '@/lib/graphql/public-request'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlMissingFieldError, toTemplateDeployError } from '@/lib/graphql/schema-errors'
import { insertWorkoutTemplateWithFallbacks } from '@/lib/workout/insert-workout-template'
import { insertTemplateExercises } from '@/lib/workout/insert-template-exercises'
import { buildTemplateShareUrl } from '@/lib/workout/template-share-url'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useSharedTemplateByToken(shareToken: string) {
  return useQuery({
    queryKey: ['workout-templates', 'shared', shareToken],
    enabled: Boolean(shareToken),
    queryFn: async () => {
      const data = await publicGraphqlRequest<{
        workout_templates: SharedWorkoutTemplate[]
      }>(GET_SHARED_TEMPLATE_BY_TOKEN, { token: shareToken })

      return data.workout_templates[0] ?? null
    },
  })
}

export function useEnableTemplateShare() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      shareToken,
    }: {
      templateId: string
      shareToken: string
    }) => {
      const data = await graphqlRequest<{
        update_workout_templates_by_pk: { id: string; share_token: string } | null
      }>(nhost, ENABLE_TEMPLATE_SHARE, {
        id: templateId,
        shareToken,
      })

      if (!data.update_workout_templates_by_pk?.share_token) {
        throw new Error("Impossible d'activer le partage.")
      }

      return data.update_workout_templates_by_pk
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['workout-templates', variables.templateId],
      })
      await queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
    },
  })
}

export function useImportTemplateFromShare() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      template,
      name,
    }: {
      template: WorkoutTemplate | SharedWorkoutTemplate
      name: string
    }) => {
      const draft = templateToDraft(template)
      const defaultRestSeconds =
        template.default_rest_seconds ?? DEFAULT_GLOBAL_REST_SECONDS

      if (draft.exercises.length === 0) {
        throw new Error('Ce modèle ne contient aucun exercice à importer.')
      }

      const created = await insertWorkoutTemplateWithFallbacks(nhost, {
        name,
        defaultRestSeconds,
        sessionMode: draft.sessionMode,
        emomIntervalSeconds: draft.emomIntervalSeconds,
        emomTotalMinutes: draft.emomTotalMinutes,
      })

      try {
        await insertTemplateExercises(nhost, created.id, draft.exercises, defaultRestSeconds)
      } catch (error) {
        await graphqlRequest(nhost, DELETE_WORKOUT_TEMPLATE, { id: created.id }).catch(
          () => undefined,
        )
        throw toTemplateDeployError(error)
      }

      return created
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
    },
  })
}

export async function copyTemplateShareLink(shareToken: string) {
  const url = buildTemplateShareUrl(shareToken)
  await navigator.clipboard.writeText(url)
  return url
}

export async function ensureTemplateShareToken(
  template: Pick<WorkoutTemplate, 'id' | 'share_token'>,
  enableShare: (input: {
    templateId: string
    shareToken: string
  }) => Promise<{ share_token: string }>,
) {
  if (template.share_token) {
    return template.share_token
  }

  const shareToken = crypto.randomUUID()
  const result = await enableShare({ templateId: template.id, shareToken })
  return result.share_token
}

export function isTemplateShareSchemaError(error: unknown) {
  return isGraphqlMissingFieldError(error, 'share_token')
}
