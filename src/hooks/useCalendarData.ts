import { useMemo } from 'react'

import { useScheduledSessions } from '@/hooks/useScheduledSessions'
import { useMyWorkouts } from '@/hooks/useWorkouts'
import {
  buildCalendarMarkers,
  defaultCalendarRange,
  type CalendarMarkers,
} from '@/lib/schedule/calendar-markers'
import type { ScheduledSession } from '@/lib/schedule/expand-occurrences'
import { getTodayReminders } from '@/lib/schedule/today-reminders'
import { computeWeeklyStreak } from '@/lib/schedule/weekly-streak'

export function useCalendarData(now = new Date()) {
  const { data: workouts, isLoading: workoutsLoading, error: workoutsError } =
    useMyWorkouts()
  const {
    data: sessionsResult,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useScheduledSessions()

  const sessions = sessionsResult?.sessions ?? []
  const scheduleDeployed = sessionsResult?.deployed ?? true

  const range = useMemo(() => defaultCalendarRange(now), [now])

  const markers: CalendarMarkers = useMemo(
    () =>
      buildCalendarMarkers(
        workouts ?? [],
        sessions as ScheduledSession[],
        range.start,
        range.end,
        now,
      ),
    [workouts, sessions, range.start, range.end, now],
  )

  const weeklyStreak = useMemo(
    () => computeWeeklyStreak(workouts ?? [], now),
    [workouts, now],
  )

  const todayReminders = useMemo(
    () => getTodayReminders(sessions as ScheduledSession[], now),
    [sessions, now],
  )

  return {
    workouts: workouts ?? [],
    sessions: sessions as ScheduledSession[],
    markers,
    range,
    weeklyStreak,
    todayReminders,
    isLoading: workoutsLoading || sessionsLoading,
    error: workoutsError ?? sessionsError,
    scheduleAvailable: scheduleDeployed,
    scheduleMissing: !scheduleDeployed,
  }
}
