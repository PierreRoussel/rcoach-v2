import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  DELETE_WORKOUT,
  GET_WORKOUT_BY_ID,
  GET_WORKOUT_BY_ID_WITHOUT_SHARE,
  LIST_MY_WORKOUTS,
  LIST_MY_WORKOUTS_PAGE,
  WORKOUTS_PAGE_SIZE,
  type WorkoutDetail,
  type WorkoutSummary,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useMyWorkouts() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['workouts', 'mine'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS,
      )

      return data.workouts
    },
  })
}

export type WorkoutsPageResult = {
  workouts: WorkoutSummary[]
  nextOffset: number | undefined
}

export function useMyWorkoutsInfinite(pageSize = WORKOUTS_PAGE_SIZE) {
  const { nhost, isAuthenticated } = useAuth()

  return useInfiniteQuery({
    queryKey: ['workouts', 'mine', 'infinite', pageSize],
    enabled: isAuthenticated,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS_PAGE,
        {
          limit: pageSize,
          offset: pageParam,
        },
      )

      const workouts = data.workouts
      const nextOffset = pageParam + workouts.length

      return {
        workouts,
        nextOffset:
          workouts.length === pageSize ? nextOffset : undefined,
      } satisfies WorkoutsPageResult
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  })
}

export function useWorkoutById(workoutId: string) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['workouts', workoutId],
    enabled: isAuthenticated && Boolean(workoutId),
    queryFn: async () => {
      try {
        const data = await graphqlRequest<{
          workouts_by_pk: WorkoutDetail | null
        }>(nhost, GET_WORKOUT_BY_ID, { id: workoutId })
        return data.workouts_by_pk
      } catch (error) {
        if (!isGraphqlMissingFieldError(error, 'share_token')) {
          throw error
        }

        const data = await graphqlRequest<{
          workouts_by_pk: WorkoutDetail | null
        }>(nhost, GET_WORKOUT_BY_ID_WITHOUT_SHARE, { id: workoutId })
        return data.workouts_by_pk
      }
    },
  })
}

export function useDeleteWorkout() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workoutId: string) => {
      const data = await graphqlRequest<{
        delete_workouts_by_pk: { id: string } | null
      }>(nhost, DELETE_WORKOUT, { id: workoutId })

      if (!data.delete_workouts_by_pk) {
        throw new Error('Seance introuvable ou deja supprimee.')
      }

      return data.delete_workouts_by_pk
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workouts'] })
    },
  })
}

export type WeeklyVolumePoint = {
  week: string
  volume: number
  sessions: number
}

function getWeekKey(date: string) {
  const value = new Date(date)
  const day = value.getUTCDay() || 7
  value.setUTCDate(value.getUTCDate() - day + 1)
  return value.toISOString().slice(0, 10)
}

export function useWorkoutStats(workouts: WorkoutSummary[] | undefined) {
  return useMemo(() => {
    const weekly = new Map<string, WeeklyVolumePoint>()

    for (const workout of workouts ?? []) {
      const week = getWeekKey(workout.started_at)
      const current = weekly.get(week) ?? { week, volume: 0, sessions: 0 }

      for (const exercise of workout.workout_exercises) {
        for (const set of exercise.sets) {
          if (set.weight_kg != null && set.reps != null) {
            current.volume += set.weight_kg * set.reps
          }
        }
      }

      current.sessions += 1
      weekly.set(week, current)
    }

    return [...weekly.values()].sort((left, right) =>
      left.week.localeCompare(right.week),
    )
  }, [workouts])
}

export function countWorkoutSets(workout: WorkoutSummary) {
  return workout.workout_exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  )
}
