import { isBefore, startOfDay, subDays } from 'date-fns'

import {
  getOccurrencesForDate,
  type ScheduledSession,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'
import {
  findFulfillingWorkout,
  occurrenceIsFulfilled,
  workoutOccurrenceKey,
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

  const consumedWorkoutKeys = new Set<string>()

  return getOccurrencesForDate(sessions, day).filter((occurrence) => {
    if (occurrenceIsFulfilled(workouts, occurrence, now, consumedWorkoutKeys)) {
      const fulfilling = findFulfillingWorkout(
        workouts,
        occurrence,
        now,
        consumedWorkoutKeys,
      )
      if (fulfilling) {
        consumedWorkoutKeys.add(workoutOccurrenceKey(fulfilling))
      }
      return false
    }
    return true
  })
}

export function getYesterdayMissedOccurrences(
  sessions: ScheduledSession[],
  workouts: WorkoutOccurrenceCheck[],
  now = new Date(),
): ScheduleOccurrence[] {
  const yesterday = subDays(startOfDay(now), 1)
  return getMissedOccurrencesForDay(sessions, workouts, yesterday, now)
}
