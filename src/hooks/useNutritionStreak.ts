import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { LIST_MEAL_LOG_ENTRIES_FOR_RANGE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import { NUTRITION_STREAK_LOOKBACK_DAYS } from '@/lib/stats/streak-lookback'
import {
  aggregateNutritionDays,
  computeNutritionLoggingStreak,
  monthDateRange,
  type NutritionDayAggregate,
} from '@/lib/nutrition/streak'
import { useAuth } from '@/lib/nhost/AuthProvider'

type MealLogRangeEntry = {
  logged_date: string
  calories: number
}

function buildStreakRange(today = toDateKey(new Date()), lookbackDays = NUTRITION_STREAK_LOOKBACK_DAYS) {
  return {
    from: addDays(today, -lookbackDays),
    to: today,
  }
}

export function useNutritionLogHistory(from: string, to: string, dailyTarget: number) {
  const { nhost, isAuthenticated } = useAuth()

  const query = useQuery({
    queryKey: ['nutrition-log-history', from, to],
    enabled: isAuthenticated && Boolean(from) && Boolean(to),
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        meal_log_entries: MealLogRangeEntry[]
      }>(nhost, LIST_MEAL_LOG_ENTRIES_FOR_RANGE, { from, to })

      return data.meal_log_entries
    },
  })

  const dayMap = useMemo(
    () => aggregateNutritionDays(query.data ?? [], dailyTarget),
    [query.data, dailyTarget],
  )

  return {
    ...query,
    dayMap,
  }
}

export function useNutritionStreak(dailyTarget: number) {
  const range = buildStreakRange()
  const { dayMap, isLoading, error } = useNutritionLogHistory(
    range.from,
    range.to,
    dailyTarget,
  )

  const streak = useMemo(() => {
    const loggedDates = Array.from(dayMap.entries())
      .filter(([, aggregate]) => aggregate.hasLogs)
      .map(([date]) => date)

    return computeNutritionLoggingStreak(loggedDates)
  }, [dayMap])

  return { streak, isLoading, error }
}

export function useNutritionCalendarMonth(
  year: number,
  monthIndex: number,
  dailyTarget: number,
) {
  const { from, to } = monthDateRange(year, monthIndex)
  const { dayMap, isLoading, error } = useNutritionLogHistory(from, to, dailyTarget)

  return {
    dayMap,
    isLoading,
    error,
    from,
    to,
  }
}

export function getNutritionDayStatus(
  dayMap: Map<string, NutritionDayAggregate>,
  dateKey: string,
) {
  return dayMap.get(dateKey)
}
