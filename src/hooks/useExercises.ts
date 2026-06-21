import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  GET_LAST_EXERCISE_PERFORMANCE,
  INSERT_EXERCISE,
  LIST_ALL_EXERCISES,
  type Exercise,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  summarizePerformance,
  type PerformanceSummary,
} from '@/lib/workout/progressive-overload'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useAllExercises() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercises', 'all'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{ exercises: Exercise[] }>(
        nhost,
        LIST_ALL_EXERCISES,
      )
      return data.exercises
    },
  })
}

export function useCreateExercise() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name: string
      muscle_group: string
      equipment: string
      is_public?: boolean
    }) => {
      const data = await graphqlRequest<{ insert_exercises_one: Exercise | null }>(
        nhost,
        INSERT_EXERCISE,
        {
          object: {
            name: input.name,
            muscle_group: input.muscle_group,
            equipment: input.equipment,
            is_public: input.is_public ?? false,
          },
        },
      )
      return data.insert_exercises_one
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

export function useLastExercisePerformance(exerciseId: string | undefined) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercise-performance', exerciseId],
    enabled: isAuthenticated && Boolean(exerciseId),
    queryFn: async (): Promise<PerformanceSummary | null> => {
      const data = await graphqlRequest<{
        workout_exercises: Array<{
          workout: { title: string; started_at: string }
          sets: Array<{
            set_index: number
            set_type: string
            weight_kg: number | null
            reps: number | null
            duration_seconds: number | null
            distance_km: number | null
          }>
        }>
      }>(nhost, GET_LAST_EXERCISE_PERFORMANCE, { exerciseId })

      const last = data.workout_exercises[0]
      if (!last) {
        return null
      }

      return summarizePerformance(
        last.workout.title,
        last.workout.started_at,
        last.sets,
      )
    },
  })
}

export function filterExercises(
  exercises: Exercise[],
  query: string,
  muscleGroup: string | 'all',
) {
  const normalized = query.trim().toLowerCase()

  return exercises.filter((exercise) => {
    if (muscleGroup !== 'all' && exercise.muscle_group !== muscleGroup) {
      return false
    }

    if (!normalized) {
      return true
    }

    return (
      exercise.name.toLowerCase().includes(normalized) ||
      exercise.muscle_group?.toLowerCase().includes(normalized) ||
      exercise.equipment?.toLowerCase().includes(normalized)
    )
  })
}
