import { isBefore, startOfDay, subDays } from 'date-fns'

import {
  getOccurrencesForDate,
  type ScheduledSession,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'
import {
  occurrenceIsFulfilled,
  type WorkoutOccurrenceCheck,
} from '@/lib/schedule/occurrence-fulfillment'

export { hadCompletedWorkoutOnDay } from '@/lib/schedule/occurrence-fulfillment'

export function getMissedOccurrencesForDay(
  sessions: ScheduledSession[],
  workouts: WorkoutOccurrenceCheck[],
  day: Date,
  now = new Date(),
): ScheduleOccurrence[] {
  const dayStart = startOfDay(day)
  const today = startOfDay(now)

  if (!isBefore(dayStart, today)) {
    return []
  }

  return getOccurrencesForDate(sessions, day).filter(
    (occurrence) => !occurrenceIsFulfilled(workouts, occurrence),
  )
}

export function getYesterdayMissedOccurrences(
  sessions: ScheduledSession[],
  workouts: WorkoutOccurrenceCheck[],
  now = new Date(),
): ScheduleOccurrence[] {
  const yesterday = subDays(startOfDay(now), 1)
  return getMissedOccurrencesForDay(sessions, workouts, yesterday, now)
}
