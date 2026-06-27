import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import {
  LIST_MY_WORKOUTS_STATS_ALL_PAGE,
  LIST_MY_WORKOUTS_STATS_PAGE,
  WORKOUTS_PAGE_SIZE,
  type WorkoutSummary,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  resolveStatsWorkoutRange,
  type StatsWorkoutFetchPeriod,
} from '@/lib/stats/stats-workout-period'
import { useAuth } from '@/lib/nhost/AuthProvider'
import {
  resolveWorkoutsNextOffset,
  resolveWorkoutsPageLimit,
  type WorkoutsPageResult,
} from '@/hooks/useWorkouts'

const STATS_INITIAL_PAGE_SIZE = WORKOUTS_PAGE_SIZE

function useStatsWorkoutsInfinite(period: StatsWorkoutFetchPeriod) {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const { since, until } = resolveStatsWorkoutRange(period)

  return useInfiniteQuery({
    queryKey: ['workouts', 'mine', 'stats', userId, period],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 2 * 60_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<WorkoutsPageResult> => {
      const offset = pageParam
      const limit = resolveWorkoutsPageLimit(
        offset,
        STATS_INITIAL_PAGE_SIZE,
        WORKOUTS_PAGE_SIZE,
      )

      if (since) {
        const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
          nhost,
          LIST_MY_WORKOUTS_STATS_PAGE,
          {
            userId: userId!,
            limit,
            offset,
            start: since.toISOString(),
            end: until.toISOString(),
          },
        )

        const workouts = data.workouts

        return {
          workouts,
          nextOffset: resolveWorkoutsNextOffset(
            offset,
            workouts.length,
            STATS_INITIAL_PAGE_SIZE,
            WORKOUTS_PAGE_SIZE,
          ),
        }
      }

      const data = await graphqlRequest<{ workouts: WorkoutSummary[] }>(
        nhost,
        LIST_MY_WORKOUTS_STATS_ALL_PAGE,
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
          STATS_INITIAL_PAGE_SIZE,
          WORKOUTS_PAGE_SIZE,
        ),
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  })
}

export function useStatsWorkouts(period: StatsWorkoutFetchPeriod = '3m') {
  const query = useStatsWorkoutsInfinite(period)

  const workouts = useMemo(
    () => query.data?.pages.flatMap((page) => page.workouts) ?? [],
    [query.data?.pages],
  )

  useEffect(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return
    }

    void query.fetchNextPage()
  }, [
    query.hasNextPage,
    query.isFetchingNextPage,
    query.fetchNextPage,
    query.data?.pages.length,
  ])

  return {
    workouts,
    period,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    isLoadingAll: query.isLoading || query.isFetchingNextPage || (query.hasNextPage ?? false),
    error: query.error,
    hasMore: query.hasNextPage ?? false,
  }
}

/** @deprecated Préférez useStatsWorkouts(period). */
export function useAllMyWorkouts() {
  return useStatsWorkouts('all')
}
