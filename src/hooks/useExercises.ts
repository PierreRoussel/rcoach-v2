import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  GET_LAST_EXERCISE_PERFORMANCE,
  INSERT_EXERCISE,
  LIST_ALL_EXERCISES,
  LIST_EXERCISE_MERGE_MAP,
  type Exercise,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  summarizePerformance,
  type PerformanceSummary,
} from '@/lib/workout/progressive-overload'
import { requestExerciseContentEnrichment } from '@/lib/workout/enrich-exercise-content'
import {
  exerciseMatchesTextQuery,
  stripEquipmentSuffix,
} from '@/lib/workout/exercise-equipment-family'
import { exerciseOptionsIncludeEquipment } from '@/lib/workout/exercise-instance-key'
import { resolveExerciseDisplayName } from '@/lib/workout/translate-exercise-name'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useAllExercises(options?: { enabled?: boolean }) {
  const { nhost, isAuthenticated } = useAuth()
  const enabled = options?.enabled ?? true

  return useQuery({
    queryKey: ['exercises', 'all'],
    enabled: isAuthenticated && enabled,
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


export function useExerciseMergeMap() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercise-merge-map'],
    enabled: isAuthenticated,
    staleTime: 24 * 60 * 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        exercise_merge_map: Array<{ old_id: string; new_id: string }>
      }>(nhost, LIST_EXERCISE_MERGE_MAP)
      return data.exercise_merge_map
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
            content_status: 'pending',
          },
        },
      )
      return data.insert_exercises_one
    },
    onSuccess: (exercise) => {
      if (exercise) {
        void requestExerciseContentEnrichment(nhost, exercise.id)
        queryClient.setQueryData<Exercise[]>(['exercises', 'all'], (current) => {
          if (!current) {
            return [exercise]
          }

          if (current.some((item) => item.id === exercise.id)) {
            return current
          }

          return [exercise, ...current]
        })

        void queryClient.invalidateQueries({ queryKey: ['exercise-content', exercise.id] })
      }

      void queryClient.invalidateQueries({ queryKey: ['exercises'] })
    },
  })
}

export function useLastExercisePerformance(
  exerciseId: string | undefined,
  equipment?: string | null,
) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercise-performance', exerciseId, equipment ?? null],
    enabled: isAuthenticated && Boolean(exerciseId),
    queryFn: async (): Promise<PerformanceSummary | null> => {
      const data = await graphqlRequest<{
        workout_exercises: Array<{
          workout: { title: string; started_at: string }
          equipment: string | null
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
      }>(nhost, GET_LAST_EXERCISE_PERFORMANCE, { exerciseId, equipment: equipment ?? null })

      const matching = equipment
        ? data.workout_exercises.filter(
            (row) => (row.equipment ?? null) === equipment,
          )
        : data.workout_exercises
      const last = matching[0]
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
) {
  return exercises.filter((exercise) => {
    if (muscleGroup !== 'all' && exercise.muscle_group !== muscleGroup) {
      return false
    }

    const textMatch = exerciseMatchesTextQuery(exercise, query)
    const equipMatch = exerciseOptionsIncludeEquipment(exercise, query)
    const baseMatch =
      query.trim().length > 0 &&
      stripEquipmentSuffix(exercise.name).toLowerCase().includes(query.trim().toLowerCase())

    return textMatch || equipMatch || baseMatch
  })
}

export { resolveExerciseDisplayName }
