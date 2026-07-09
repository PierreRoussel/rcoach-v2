import type { BadgeDefinitionRecord } from '@/lib/gamification/badges'
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

function matchesBadgeRule(
  definition: BadgeDefinitionRecord,
  input: BadgeEvaluationInput,
): boolean {
  if (!definition.is_active || definition.rule_type === 'manual') {
    return false
  }

  const threshold = Number(definition.rule_threshold ?? 0)

  switch (definition.rule_type) {
    case 'nutrition_streak':
      return input.nutritionStreak >= threshold
    case 'workout_streak':
      return input.workoutWeeklyStreak >= threshold
    case 'sessions':
      return input.totalSessions >= threshold
    case 'pr_count':
      return input.totalPrCount >= threshold
    case 'volume_kg':
      return input.totalVolumeKg >= threshold
    default:
      return false
  }
}

export function evaluateEligibleBadges(
  input: BadgeEvaluationInput,
  definitions: BadgeDefinitionRecord[],
): string[] {
  return definitions
    .filter((definition) => matchesBadgeRule(definition, input))
    .map((definition) => definition.key)
}

export function findNewBadgeKeys(eligibleKeys: string[], unlockedKeys: string[]): string[] {
  const unlocked = new Set(unlockedKeys)
  return eligibleKeys.filter((key) => !unlocked.has(key))
}
