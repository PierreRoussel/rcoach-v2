import { useMemo } from 'react'

import { useNutritionCalendarMonth } from '@/hooks/useNutritionStreak'
import { useScheduledSessions } from '@/hooks/useScheduledSessions'
import { useMyWorkoutsInRange, useWorkoutStreakDates } from '@/hooks/useWorkouts'
import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import {
  buildCalendarMarkers,
  monthCalendarRange,
  type CalendarMarkers,
} from '@/lib/schedule/calendar-markers'
import type { ScheduledSession } from '@/lib/schedule/expand-occurrences'
import { getTodayReminders } from '@/lib/schedule/today-reminders'
import { computeWeeklyStreak } from '@/lib/schedule/weekly-streak'

export type CalendarDataOptions = {
  now?: Date
  visibleMonth?: Date
  nutritionDailyTarget?: number | null
}

export function useCalendarData(options?: CalendarDataOptions) {
  const now = options?.now ?? new Date()
  const visibleMonth = options?.visibleMonth ?? now
  const nutritionEnabled =
    options?.nutritionDailyTarget != null && options.nutritionDailyTarget > 0
  const monthRange = useMemo(
    () => monthCalendarRange(visibleMonth),
    [visibleMonth.getFullYear(), visibleMonth.getMonth()],
  )

  const {
    data: monthWorkouts,
    isLoading: monthWorkoutsLoading,
    error: monthWorkoutsError,
  } = useMyWorkoutsInRange(monthRange)
  const {
    data: streakWorkouts,
    isLoading: streakLoading,
    error: streakError,
  } = useWorkoutStreakDates(now)
  const {
    data: sessionsResult,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useScheduledSessions()
  const {
    dayMap: nutritionDays,
    isLoading: nutritionLoading,
    error: nutritionError,
  } = useNutritionCalendarMonth(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    options?.nutritionDailyTarget ?? 2000,
    nutritionEnabled,
  )

  const sessions = sessionsResult?.sessions ?? []
  const scheduleDeployed = sessionsResult?.deployed ?? true

  const markers: CalendarMarkers = useMemo(
    () =>
      buildCalendarMarkers(
        monthWorkouts ?? [],
        sessions as ScheduledSession[],
        monthRange.start,
        monthRange.end,
        now,
      ),
    [monthWorkouts, sessions, monthRange.start, monthRange.end, now],
  )

  const weeklyStreak = useMemo(
    () => computeWeeklyStreak(streakWorkouts ?? [], now),
    [streakWorkouts, now],
  )

  const todayReminders = useMemo(
    () => getTodayReminders(sessions as ScheduledSession[], now),
    [sessions, now],
  )

  const emptyNutritionDays = useMemo(
    () => new Map<string, NutritionDayAggregate>(),
    [],
  )

  return {
    workouts: monthWorkouts ?? [],
    sessions: sessions as ScheduledSession[],
    markers,
    nutritionDays: nutritionEnabled ? nutritionDays : emptyNutritionDays,
    nutritionEnabled,
    range: monthRange,
    weeklyStreak,
    todayReminders,
    isLoading:
      monthWorkoutsLoading ||
      streakLoading ||
      sessionsLoading ||
      (nutritionEnabled && nutritionLoading),
    error:
      monthWorkoutsError ??
      streakError ??
      sessionsError ??
      (nutritionEnabled ? nutritionError : null),
    scheduleAvailable: scheduleDeployed,
    scheduleMissing: !scheduleDeployed,
  }
}
