import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DEFAULT_GLOBAL_REST_SECONDS } from '@/hooks/useWorkoutTemplates'
import {
  ENABLE_WORKOUT_SHARE,
  GET_SHARED_WORKOUT_BY_TOKEN,
  GET_TEMPLATE_BY_SOURCE_WORKOUT,
  INSERT_WORKOUT_TEMPLATE,
  type SharedWorkoutDetail,
  type WorkoutDetail,
  type WorkoutSummary,
  type WorkoutTemplate,
} from '@/lib/graphql/operations'
import { publicGraphqlRequest } from '@/lib/graphql/public-request'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import { buildWorkoutShareUrl } from '@/lib/workout/share-url'
import { insertTemplateExercises } from '@/lib/workout/insert-template-exercises'
import { workoutToTemplateExercises } from '@/lib/workout/workout-to-template'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useTemplateBySourceWorkout(workoutId: string) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['workout-templates', 'source', workoutId],
    enabled: isAuthenticated && Boolean(workoutId),
    queryFn: async () => {
      try {
        const data = await graphqlRequest<{
          workout_templates: Array<{ id: string; name: string }>
        }>(nhost, GET_TEMPLATE_BY_SOURCE_WORKOUT, { workoutId })

        return data.workout_templates[0] ?? null
      } catch (error) {
        if (isGraphqlMissingFieldError(error, 'source_workout_id')) {
          return null
        }

        throw error
      }
    },
  })
}

export function useSharedWorkoutByToken(shareToken: string) {
  return useQuery({
    queryKey: ['workouts', 'shared', shareToken],
    enabled: Boolean(shareToken),
    queryFn: async () => {
      const data = await publicGraphqlRequest<{
        workouts: SharedWorkoutDetail[]
      }>(GET_SHARED_WORKOUT_BY_TOKEN, { token: shareToken })

      return data.workouts[0] ?? null
    },
  })
}

export function useEnableWorkoutShare() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      workoutId,
      shareToken,
    }: {
      workoutId: string
      shareToken: string
    }) => {
      const data = await graphqlRequest<{
        update_workouts_by_pk: { id: string; share_token: string } | null
      }>(nhost, ENABLE_WORKOUT_SHARE, {
        id: workoutId,
        shareToken,
      })

      if (!data.update_workouts_by_pk?.share_token) {
        throw new Error('Impossible d activer le partage.')
      }

      return data.update_workouts_by_pk
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['workouts', variables.workoutId],
      })
    },
  })
}

export function useCreateTemplateFromWorkout() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      workout,
      name,
      defaultRestSeconds = DEFAULT_GLOBAL_REST_SECONDS,
    }: {
      workout: WorkoutDetail | WorkoutSummary
      name: string
      defaultRestSeconds?: number
    }) => {
      const exercises = workoutToTemplateExercises(workout, defaultRestSeconds)

      let template: WorkoutTemplate

      try {
        const data = await graphqlRequest<{
          insert_workout_templates_one: WorkoutTemplate
        }>(nhost, INSERT_WORKOUT_TEMPLATE, {
          object: {
            name,
            default_rest_seconds: defaultRestSeconds,
            source_workout_id: workout.id,
          },
        })
        template = data.insert_workout_templates_one
      } catch (error) {
        if (!isGraphqlMissingFieldError(error, 'source_workout_id')) {
          throw error
        }

        const data = await graphqlRequest<{
          insert_workout_templates_one: WorkoutTemplate
        }>(nhost, INSERT_WORKOUT_TEMPLATE, {
          object: {
            name,
            default_rest_seconds: defaultRestSeconds,
          },
        })
        template = data.insert_workout_templates_one
      }

      await insertTemplateExercises(
        nhost,
        template.id,
        exercises,
        defaultRestSeconds,
      )

      return template
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
      await queryClient.invalidateQueries({
        queryKey: ['workout-templates', 'source', variables.workout.id],
      })
    },
  })
}

export async function copyWorkoutShareLink(shareToken: string) {
  const url = buildWorkoutShareUrl(shareToken)
  await navigator.clipboard.writeText(url)
  return url
}

export async function ensureWorkoutShareToken(
  workout: Pick<WorkoutDetail, 'id' | 'share_token'>,
  enableShare: (input: { workoutId: string; shareToken: string }) => Promise<{
    share_token: string
  }>,
) {
  if (workout.share_token) {
    return workout.share_token
  }

  const shareToken = crypto.randomUUID()
  const result = await enableShare({ workoutId: workout.id, shareToken })
  return result.share_token
}
