import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  DELETE_WORKOUT,
  GET_WORKOUT_BY_ID,
  GET_WORKOUT_BY_ID_WITHOUT_SHARE,
  LIST_MY_WORKOUTS,
  HISTORY_WORKOUTS_INITIAL_PAGE_SIZE,
  HISTORY_WORKOUTS_LOAD_MORE_PAGE_SIZE,
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

export type MyWorkoutsInfiniteOptions = {
  initialPageSize?: number
  pageSize?: number
}

function resolveMyWorkoutsInfiniteOptions(
  options: number | MyWorkoutsInfiniteOptions = {},
): { initialPageSize: number; pageSize: number } {
  if (typeof options === 'number') {
    return { initialPageSize: options, pageSize: options }
  }

  const pageSize = options.pageSize ?? WORKOUTS_PAGE_SIZE

  return {
    initialPageSize: options.initialPageSize ?? pageSize,
    pageSize,
  }
}

export function resolveWorkoutsPageLimit(
  offset: number,
  initialPageSize: number,
  pageSize: number,
): number {
  return offset === 0 ? initialPageSize : pageSize
}

export function resolveWorkoutsNextOffset(
  offset: number,
  loadedCount: number,
  initialPageSize: number,
  pageSize: number,
): number | undefined {
  const expectedLimit = resolveWorkoutsPageLimit(offset, initialPageSize, pageSize)

  if (loadedCount < expectedLimit) {
    return undefined
  }

  return offset + loadedCount
}

export function useMyWorkoutsInfinite(
  options: number | MyWorkoutsInfiniteOptions = {},
) {
  const { initialPageSize, pageSize } = resolveMyWorkoutsInfiniteOptions(options)
  const { nhost, isAuthenticated } = useAuth()

  return useInfiniteQuery({
    queryKey: ['workouts', 'mine', 'infinite', initialPageSize, pageSize],
    enabled: isAuthenticated,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam
      const limit = resolveWorkoutsPageLimit(offset, initialPageSize, pageSize)
      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS_PAGE,
        {
          limit,
          offset,
        },
      )

      const workouts = data.workouts

      return {
        workouts,
        nextOffset: resolveWorkoutsNextOffset(
          offset,
          workouts.length,
          initialPageSize,
          pageSize,
        ),
      } satisfies WorkoutsPageResult
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  })
}

export {
  HISTORY_WORKOUTS_INITIAL_PAGE_SIZE,
  HISTORY_WORKOUTS_LOAD_MORE_PAGE_SIZE,
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
        throw new Error('Séance introuvable ou déjà supprimée.')
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
