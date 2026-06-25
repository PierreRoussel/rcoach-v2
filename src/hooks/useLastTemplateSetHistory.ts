import { useQuery } from '@tanstack/react-query'

import {
  GET_LAST_TEMPLATE_WORKOUT,
  type WorkoutTemplate,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import {
  buildTemplateSetHistory,
  pickLastMatchingWorkout,
  type HistoricalWorkout,
  type TemplateSetHistory,
} from '@/lib/workout/template-set-history'
import { useAuth } from '@/lib/nhost/AuthProvider'

type LastTemplateSetHistoryResult = {
  history: TemplateSetHistory
  lastSessionDate: string | null
  isLoading: boolean
}

export function useLastTemplateSetHistory(
  templateId: string | null | undefined,
  options?: { includeRpe?: boolean },
): LastTemplateSetHistoryResult {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const includeRpe = options?.includeRpe ?? true

  const query = useQuery({
    queryKey: ['template-set-history', userId, templateId, includeRpe],
    enabled: isAuthenticated && Boolean(templateId) && Boolean(userId),
    queryFn: async () => {
      try {
        const data = await graphqlRequest<{
          workouts: HistoricalWorkout[]
          workout_templates_by_pk: WorkoutTemplate | null
        }>(nhost, GET_LAST_TEMPLATE_WORKOUT, { userId: userId!, templateId })

        const templateExerciseIds =
          data.workout_templates_by_pk?.workout_template_exercises.map(
            (entry) => entry.exercise.id,
          ) ?? []

        const lastWorkout = pickLastMatchingWorkout(
          data.workouts,
          templateId!,
          templateExerciseIds,
        )

        return {
          history: buildTemplateSetHistory(lastWorkout, { includeRpe }),
          lastSessionDate: lastWorkout?.started_at ?? null,
        }
      } catch (error) {
        if (isGraphqlMissingFieldError(error, 'workout_template_id')) {
          return {
            history: new Map(),
            lastSessionDate: null,
          }
        }

        throw error
      }
    },
  })

  return {
    history: query.data?.history ?? new Map(),
    lastSessionDate: query.data?.lastSessionDate ?? null,
    isLoading: query.isLoading,
  }
}
