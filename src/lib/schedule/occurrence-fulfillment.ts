import { format, isAfter, parseISO, startOfDay, subDays } from 'date-fns'

import {
  datesMatchWorkoutDay,
  type ScheduleOccurrence,
} from '@/lib/schedule/expand-occurrences'

export type WorkoutOccurrenceCheck = {
  id?: string
  started_at: string
  ended_at: string | null
  workout_template_id?: string | null
}

export function workoutOccurrenceKey(workout: WorkoutOccurrenceCheck): string {
  return workout.id ?? workout.started_at
}

export function isCompletedWorkout(workout: WorkoutOccurrenceCheck): boolean {
  return workout.ended_at != null
}

function occurrencePlannedDay(occurrence: ScheduleOccurrence): Date {
  return startOfDay(parseISO(`${occurrence.date}T12:00:00`))
}

function workoutDayStart(workout: WorkoutOccurrenceCheck): Date {
  return startOfDay(parseISO(workout.started_at))
}

export function workoutFulfillsOccurrenceOnCatchUpDay(
  workout: WorkoutOccurrenceCheck,
  occurrence: ScheduleOccurrence,
  now = new Date(),
): boolean {
  if (!isCompletedWorkout(workout)) {
    return false
  }

  const plannedDay = occurrencePlannedDay(occurrence)
  const performedDay = workoutDayStart(workout)
  const today = startOfDay(now)

  if (datesMatchWorkoutDay(workout.started_at, plannedDay)) {
    return false
  }

  const isDayAfterPlanned =
    format(subDays(performedDay, 1), 'yyyy-MM-dd') === format(plannedDay, 'yyyy-MM-dd')

  if (!isDayAfterPlanned || isAfter(performedDay, today)) {
    return false
  }

  if (occurrence.workoutTemplateId) {
    return workout.workout_template_id === occurrence.workoutTemplateId
  }

  return true
}

export function workoutFulfillsOccurrence(
  workout: WorkoutOccurrenceCheck,
  occurrence: ScheduleOccurrence,
  now = new Date(),
): boolean {
  if (!isCompletedWorkout(workout)) {
    return false
  }

  const plannedDay = occurrencePlannedDay(occurrence)

  if (datesMatchWorkoutDay(workout.started_at, plannedDay)) {
    if (occurrence.workoutTemplateId) {
      return workout.workout_template_id === occurrence.workoutTemplateId
    }
    return true
  }

  return workoutFulfillsOccurrenceOnCatchUpDay(workout, occurrence, now)
}

export function findFulfillingWorkout<T extends WorkoutOccurrenceCheck>(
  workouts: T[],
  occurrence: ScheduleOccurrence,
  now = new Date(),
  consumedWorkoutKeys: ReadonlySet<string> = new Set(),
): T | undefined {
  return workouts.find(
    (workout) =>
      !consumedWorkoutKeys.has(workoutOccurrenceKey(workout)) &&
      workoutFulfillsOccurrence(workout, occurrence, now),
  )
}

export function occurrenceIsFulfilled(
  workouts: WorkoutOccurrenceCheck[],
  occurrence: ScheduleOccurrence,
  now = new Date(),
  consumedWorkoutKeys: ReadonlySet<string> = new Set(),
): boolean {
  return (
    findFulfillingWorkout(workouts, occurrence, now, consumedWorkoutKeys) !== undefined
  )
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