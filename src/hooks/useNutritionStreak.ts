import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useOptionalNutritionStreakGamification } from '@/components/nutrition/NutritionStreakGamificationProvider'
import { fetchNutritionHintRangeEntries } from '@/lib/nutrition/fetch-nutrition-day-entries'
import {
  aggregateNutritionDays,
  monthDateRange,
  type NutritionDayAggregate,
} from '@/lib/nutrition/streak'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useNutritionLogHistory(
  from: string,
  to: string,
  dailyTarget: number,
  enabled = true,
) {
  const { nhost, isAuthenticated, user } = useAuth()

  const query = useQuery({
    queryKey: ['nutrition-log-history', user?.id, from, to],
    enabled:
      enabled &&
      isAuthenticated &&
      Boolean(user?.id) &&
      Boolean(from) &&
      Boolean(to),
    staleTime: 60_000,
    queryFn: async () => {
      const entries = await fetchNutritionHintRangeEntries(
        nhost,
        user!.id,
        from,
        to,
      )

      return entries.map((entry) => ({
        logged_date: entry.logged_date,
        calories: Number(entry.calories),
        meal_type: entry.meal_type,
      }))
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
  const context = useOptionalNutritionStreakGamification()

  if (!context) {
    return {
      streak: 0,
      isLoading: true,
      error: null,
      isFrozen: false,
      recoveryProgress: null,
      validatedToday: false,
    }
  }

  const {
    displayStreak,
    isLoading,
    error,
    isFrozen,
    recoveryProgress,
    validatedToday,
  } = context

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
  enabled = true,
) {
  const { from, to } = monthDateRange(year, monthIndex)
  const { dayMap, isLoading, error } = useNutritionLogHistory(
    from,
    to,
    dailyTarget,
    enabled,
  )

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
