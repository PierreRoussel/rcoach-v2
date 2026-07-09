import type { BadgeKey } from '@/lib/gamification/badges'
import type { WorkoutSummary } from '@/lib/graphql/operations'
import {
  computeWorkoutVolume,
  countWorkoutPersonalRecords,
} from '@/lib/stats/workout-metrics'

export type BadgeEvaluationInput = {
  nutritionStreak: number
  workoutWeeklyStreak: number
  totalSessions: number
  totalVolumeKg: number
  totalPrCount: number
}

export function countTotalPersonalRecords(workouts: WorkoutSummary[]): number {
  const sorted = [...workouts].sort(
    (left, right) =>
      new Date(left.started_at).getTime() - new Date(right.started_at).getTime(),
  )
  const history: WorkoutSummary[] = []
  let total = 0

  for (const workout of sorted) {
    total += countWorkoutPersonalRecords(workout, history)
    history.push(workout)
  }

  return total
}

export function computeTotalVolumeKg(workouts: WorkoutSummary[]): number {
  return workouts.reduce((sum, workout) => sum + computeWorkoutVolume(workout), 0)
}

export function evaluateEligibleBadges(input: BadgeEvaluationInput): BadgeKey[] {
  const eligible: BadgeKey[] = []

  if (input.nutritionStreak >= 7) eligible.push('nutrition_streak_7')
  if (input.nutritionStreak >= 30) eligible.push('nutrition_streak_30')
  if (input.nutritionStreak >= 100) eligible.push('nutrition_streak_100')

  if (input.workoutWeeklyStreak >= 4) eligible.push('workout_streak_4')
  if (input.workoutWeeklyStreak >= 12) eligible.push('workout_streak_12')
  if (input.workoutWeeklyStreak >= 52) eligible.push('workout_streak_52')

  if (input.totalSessions >= 10) eligible.push('sessions_10')
  if (input.totalSessions >= 50) eligible.push('sessions_50')
  if (input.totalSessions >= 100) eligible.push('sessions_100')
  if (input.totalSessions >= 365) eligible.push('sessions_365')

  if (input.totalPrCount >= 1) eligible.push('first_pr')
  if (input.totalPrCount >= 10) eligible.push('pr_10')
  if (input.totalPrCount >= 50) eligible.push('pr_50')

  if (input.totalVolumeKg >= 10_000) eligible.push('volume_10k')
  if (input.totalVolumeKg >= 100_000) eligible.push('volume_100k')
  if (input.totalVolumeKg >= 1_000_000) eligible.push('volume_1m')

  return eligible
}

export function findNewBadgeKeys(
  eligibleKeys: BadgeKey[],
  unlockedKeys: string[],
): BadgeKey[] {
  const unlocked = new Set(unlockedKeys)
  return eligibleKeys.filter((key) => !unlocked.has(key))
}
