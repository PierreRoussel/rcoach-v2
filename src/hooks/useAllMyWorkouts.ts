import { useEffect, useMemo } from 'react'

import { useMyWorkoutsInfinite } from '@/hooks/useWorkouts'

const MAX_AUTO_PAGES = 34
const WORKOUTS_CAP = MAX_AUTO_PAGES * 15

export function useAllMyWorkouts() {
  const query = useMyWorkoutsInfinite()

  const workouts = useMemo(
    () => query.data?.pages.flatMap((page) => page.workouts) ?? [],
    [query.data?.pages],
  )

  useEffect(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return
    }

    if (workouts.length >= WORKOUTS_CAP) {
      return
    }

    void query.fetchNextPage()
  }, [
    query.hasNextPage,
    query.isFetchingNextPage,
    query.fetchNextPage,
    workouts.length,
  ])

  return {
    workouts,
    isLoading: query.isLoading,
    error: query.error,
    hasMore: query.hasNextPage ?? false,
    isFetchingMore: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    isCapped: workouts.length >= WORKOUTS_CAP && (query.hasNextPage ?? false),
  }
}
