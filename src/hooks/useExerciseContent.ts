import { useQuery } from '@tanstack/react-query'

import { GET_EXERCISE_CONTENT } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'
import type {
  ExerciseCoachingCues,
  ExerciseContentStatus,
} from '@/lib/workout/exercise-coaching'

export type ExerciseContent = {
  id: string
  name: string
  muscle_group: string | null
  equipment: string | null
  tracking_mode: string | null
  description_fr: string | null
  coaching_cues: ExerciseCoachingCues | null
  demo_file_id: string | null
  demo_poster_file_id: string | null
  content_status: ExerciseContentStatus
  content_source: string | null
}

export function useExerciseContent(exerciseId: string | undefined, enabled = true) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercise-content', exerciseId],
    enabled: enabled && isAuthenticated && Boolean(exerciseId),
    staleTime: 5 * 60_000,
    refetchInterval: (query) =>
      query.state.data?.content_status === 'pending' ? 3_000 : false,
    queryFn: async (): Promise<ExerciseContent | null> => {
      const data = await graphqlRequest<{ exercises_by_pk: ExerciseContent | null }>(
        nhost,
        GET_EXERCISE_CONTENT,
        { id: exerciseId },
      )

      return data.exercises_by_pk
    },
  })
}
