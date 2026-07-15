import { parseISO } from 'date-fns'

import {
  datesMatchWorkoutDay,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'

export type WorkoutOccurrenceCheck = {
  started_at: string
  ended_at: string | null
  workout_template_id?: string | null
}

export function isCompletedWorkout(workout: WorkoutOccurrenceCheck): boolean {
  return workout.ended_at != null
}

export function workoutFulfillsOccurrence(
  workout: WorkoutOccurrenceCheck,
  occurrence: ScheduleOccurrence,
): boolean {
  if (!isCompletedWorkout(workout)) {
    return false
  }

  if (!datesMatchWorkoutDay(workout.started_at, parseISO(`${occurrence.date}T12:00:00`))) {
    return false
  }

  if (occurrence.workoutTemplateId) {
    return workout.workout_template_id === occurrence.workoutTemplateId
  }

  return true
}

export function findFulfillingWorkout<T extends WorkoutOccurrenceCheck>(
  workouts: T[],
  occurrence: ScheduleOccurrence,
): T | undefined {
  return workouts.find((workout) => workoutFulfillsOccurrence(workout, occurrence))
}

export function occurrenceIsFulfilled(
  workouts: WorkoutOccurrenceCheck[],
  occurrence: ScheduleOccurrence,
): boolean {
  return findFulfillingWorkout(workouts, occurrence) !== undefined
}

export function hadCompletedWorkoutOnDay(
  workouts: WorkoutOccurrenceCheck[],
  day: Date,
): boolean {
  return workouts.some(
    (workout) =>
      isCompletedWorkout(workout) && datesMatchWorkoutDay(workout.started_at, day),
  )
}
