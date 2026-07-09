import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { startOfDay, subWeeks } from 'date-fns'

import {
  DELETE_WORKOUT,
  INSERT_WORKOUT,
  GET_MY_LAST_COMPLETED_WORKOUT,
  GET_WORKOUT_BY_ID,
  GET_WORKOUT_BY_ID_WITHOUT_SHARE,
  LIST_MY_WORKOUTS,
  LIST_MY_WORKOUTS_IN_RANGE,
  LIST_MY_WORKOUT_STREAK_DATES,
  HISTORY_WORKOUTS_INITIAL_PAGE_SIZE,
  HISTORY_WORKOUTS_LOAD_MORE_PAGE_SIZE,
  LIST_MY_WORKOUTS_PAGE,
  WORKOUTS_PAGE_SIZE,
  type CalendarWorkoutSummary,
  type WorkoutDetail,
  type WorkoutHeaderSummary,
  type WorkoutSummary,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlMissingFieldError } from '@/lib/graphql/schema-errors'
import { calendarDayTimestamp } from '@/lib/schedule/calendar-markers'
import { computeWeeklyStreak } from '@/lib/schedule/weekly-streak'
import { WORKOUT_STREAK_LOOKBACK_WEEKS } from '@/lib/stats/streak-lookback'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useMyWorkouts(options?: { enabled?: boolean }) {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const queryEnabled = (options?.enabled ?? true) && isAuthenticated && Boolean(userId)

  return useQuery({
    queryKey: ['workouts', 'mine', userId],
    enabled: queryEnabled,
    queryFn: async () => {
      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS,
        { userId: userId! },
      )

      return data.workouts
    },
  })
}

export function useMyLastCompletedWorkout() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['workouts', 'mine', userId, 'last-completed'],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 60_000,
    queryFn: async (): Promise<WorkoutSummary | null> => {
      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        GET_MY_LAST_COMPLETED_WORKOUT,
        { userId: userId! },
      )

      return data.workouts[0] ?? null
    },
  })
}

const STREAK_LOOKBACK_WEEKS = WORKOUT_STREAK_LOOKBACK_WEEKS

function formatRangeKey(date: Date) {
  return date.toISOString()
}

export function useMyWorkoutsInRange(range: { start: Date; end: Date } | null) {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const startKey = range ? formatRangeKey(range.start) : null
  const endKey = range ? formatRangeKey(range.end) : null

  return useQuery({
    queryKey: ['workouts', 'mine', userId, 'range', startKey, endKey],
    enabled: isAuthenticated && Boolean(userId) && Boolean(range),
    queryFn: async (): Promise<CalendarWorkoutSummary[]> => {
      const data = await graphqlRequest<{ workouts: CalendarWorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS_IN_RANGE,
        {
          userId: userId!,
          start: range!.start.toISOString(),
          end: range!.end.toISOString(),
        },
      )

      return data.workouts
    },
  })
}

export function useWorkoutStreakDates(now = new Date()) {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const since = useMemo(
    () => subWeeks(startOfDay(now), STREAK_LOOKBACK_WEEKS).toISOString(),
    [now],
  )

  return useQuery({
    queryKey: ['workouts', 'mine', userId, 'streak-dates', since],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Array<{ started_at: string }>> => {
      const data = await graphqlRequest<{
        workouts: Array<{ started_at: string }>
      }>(nhost, LIST_MY_WORKOUT_STREAK_DATES, {
        userId: userId!,
        since,
      })

      return data.workouts
    },
  })
}

export function useWorkoutWeeklyStreak(now = new Date()) {
  const { data: workouts, isLoading, error } = useWorkoutStreakDates(now)
  const streak = useMemo(
    () => computeWeeklyStreak(workouts ?? [], now),
    [workouts, now],
  )

  return { streak, isLoading, error }
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
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useInfiniteQuery({
    queryKey: ['workouts', 'mine', 'infinite', userId, initialPageSize, pageSize],
    enabled: isAuthenticated && Boolean(userId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam
      const limit = resolveWorkoutsPageLimit(offset, initialPageSize, pageSize)
      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS_PAGE,
        {
          userId: userId!,
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

export function useCreateSimpleWorkout() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, date }: { title: string; date: Date }) => {
      const startedAt = calendarDayTimestamp(date)
      const endedAt = new Date(startedAt.getTime() + 60_000)

      const data = await graphqlRequest<{
        insert_workouts_one: { id: string }
      }>(nhost, INSERT_WORKOUT, {
        object: {
          title: title.trim(),
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
        },
      })

      return data.insert_workouts_one
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workouts'] })
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
