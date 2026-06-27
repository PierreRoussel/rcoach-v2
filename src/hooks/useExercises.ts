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
import {
  exerciseNameMatchesQuery,
  translateExerciseName,
} from '@/lib/workout/translate-exercise-name'
import type { ExerciseLocale } from '@/lib/workout/exercise-translations'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useAllExercises() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercises', 'all'],
    enabled: isAuthenticated,
    staleTime: 30 * 60_000,
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
      tracking_mode?: string
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
            tracking_mode: input.tracking_mode ?? 'auto',
          },
        },
      )
      return data.insert_exercises_one
    },
    onSuccess: (exercise) => {
      if (exercise) {
        queryClient.setQueryData<Exercise[]>(['exercises', 'all'], (current) => {
          if (!current) {
            return [exercise]
          }

          if (current.some((item) => item.id === exercise.id)) {
            return current
          }

          return [exercise, ...current]
        })
      }

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
          exercise: {
            name: string
            equipment: string | null
            tracking_mode?: string | null
          }
          sets: Array<{
            set_index: number
            set_type: string
            weight_kg: number | null
            reps: number | null
            rpe: number | null
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
        {
          name: last.exercise.name,
          equipment: last.exercise.equipment,
          tracking_mode: last.exercise.tracking_mode ?? null,
        },
      )
    },
  })
}

export function filterExercises(
  exercises: Exercise[],
  query: string,
  muscleGroup: string | 'all',
  locale: ExerciseLocale = 'fr',
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
      exerciseNameMatchesQuery(exercise.name, normalized, locale) ||
      exercise.muscle_group?.toLowerCase().includes(normalized) ||
      exercise.equipment?.toLowerCase().includes(normalized)
    )
  })
}

export { translateExerciseName }
