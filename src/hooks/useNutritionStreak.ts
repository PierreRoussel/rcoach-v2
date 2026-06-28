import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useNutritionStreakGamification } from '@/components/nutrition/NutritionStreakGamificationProvider'
import { LIST_MEAL_LOG_ENTRIES_FOR_RANGE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  aggregateNutritionDays,
  monthDateRange,
  type NutritionDayAggregate,
} from '@/lib/nutrition/streak'
import { useAuth } from '@/lib/nhost/AuthProvider'

type MealLogRangeEntry = {
  logged_date: string
  calories: number
}

export function useNutritionLogHistory(from: string, to: string, dailyTarget: number) {
  const { nhost, isAuthenticated, user } = useAuth()

  const query = useQuery({
    queryKey: ['nutrition-log-history', user?.id, from, to],
    enabled: isAuthenticated && Boolean(user?.id) && Boolean(from) && Boolean(to),
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        meal_log_entries: MealLogRangeEntry[]
      }>(nhost, LIST_MEAL_LOG_ENTRIES_FOR_RANGE, { from, to, userId: user!.id })

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

export function useNutritionStreak(_dailyTarget?: number) {
  const {
    displayStreak,
    isLoading,
    error,
    isFrozen,
    recoveryProgress,
    validatedToday,
  } = useNutritionStreakGamification()

  return {
    streak: displayStreak,
    isLoading,
    error,
    isFrozen,
    recoveryProgress,
    validatedToday,
  }
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
