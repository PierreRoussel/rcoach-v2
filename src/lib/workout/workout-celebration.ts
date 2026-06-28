import { isSameDay, parseISO } from 'date-fns'

import {
  getTodayOccurrences,
  type ScheduledSession,
} from '@/lib/schedule/expand-occurrences'
import { computeWeeklyStreak } from '@/lib/schedule/weekly-streak'

type WorkoutStreakSource = { started_at: string }

export function isWorkoutPlannedForToday(
  sessions: ScheduledSession[],
  options: {
    workoutTemplateId: string | null
    startedAt: string
    now?: Date
  },
): boolean {
  const now = options.now ?? new Date()

  if (!isSameDay(parseISO(options.startedAt), now)) {
    return false
  }

  const todayOccurrences = getTodayOccurrences(
    sessions.filter((session) => session.is_active),
    now,
  )

  if (todayOccurrences.length === 0) {
    return false
  }

  if (!options.workoutTemplateId) {
    return true
  }

  return todayOccurrences.some(
    (occurrence) => occurrence.workoutTemplateId === options.workoutTemplateId,
  )
}

export function willWeeklyStreakIncrease(
  workouts: WorkoutStreakSource[],
  completedWorkout: WorkoutStreakSource,
  now = new Date(),
): { increases: boolean; newStreak: number } {
  const before = computeWeeklyStreak(workouts, now)
  const after = computeWeeklyStreak([...workouts, completedWorkout], now)

  return {
    increases: after > before,
    newStreak: after,
  }
}

export type WorkoutCelebrationKind = 'planned' | 'weekly_streak'

export type WorkoutCelebrationItem =
  | { kind: 'planned' }
  | { kind: 'weekly_streak'; streak: number }

export function buildWorkoutCelebrations(input: {
  sessions: ScheduledSession[]
  existingWorkouts: WorkoutStreakSource[]
  workoutTemplateId: string | null
  startedAt: string
  now?: Date
}): WorkoutCelebrationItem[] {
  const now = input.now ?? new Date()
  const celebrations: WorkoutCelebrationItem[] = []

  if (
    isWorkoutPlannedForToday(input.sessions, {
      workoutTemplateId: input.workoutTemplateId,
      startedAt: input.startedAt,
      now,
    })
  ) {
    celebrations.push({ kind: 'planned' })
  }

  const { increases, newStreak } = willWeeklyStreakIncrease(
    input.existingWorkouts,
    { started_at: input.startedAt },
    now,
  )

  if (increases) {
    celebrations.push({ kind: 'weekly_streak', streak: newStreak })
  }

  return celebrations
}
