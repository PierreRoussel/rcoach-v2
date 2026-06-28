import { isBefore, startOfDay, subDays } from 'date-fns'

import {
  datesMatchWorkoutDay,
  getOccurrencesForDate,
  type ScheduledSession,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'

type WorkoutDayCheck = {
  started_at: string
  ended_at: string | null
}

export function hadCompletedWorkoutOnDay(
  workouts: WorkoutDayCheck[],
  day: Date,
): boolean {
  return workouts.some(
    (workout) =>
      workout.ended_at != null && datesMatchWorkoutDay(workout.started_at, day),
  )
}

export function getMissedOccurrencesForDay(
  sessions: ScheduledSession[],
  workouts: WorkoutDayCheck[],
  day: Date,
  now = new Date(),
): ScheduleOccurrence[] {
  const dayStart = startOfDay(day)
  const today = startOfDay(now)

  if (!isBefore(dayStart, today)) {
    return []
  }

  if (hadCompletedWorkoutOnDay(workouts, day)) {
    return []
  }

  return getOccurrencesForDate(sessions, day)
}

export function getYesterdayMissedOccurrences(
  sessions: ScheduledSession[],
  workouts: WorkoutDayCheck[],
  now = new Date(),
): ScheduleOccurrence[] {
  const yesterday = subDays(startOfDay(now), 1)
  return getMissedOccurrencesForDay(sessions, workouts, yesterday, now)
}
