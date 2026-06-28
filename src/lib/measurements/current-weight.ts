import type { WeightEntry } from '@/lib/graphql/operations'
import type { WeightGoal, WeightGoalRecord } from '@/lib/goals/weight-goal'

export function getLatestWeightKg(
  entries: WeightEntry[] | null | undefined,
): number | null {
  if (!entries?.length) {
    return null
  }

  const sorted = [...entries].sort(
    (left, right) =>
      new Date(right.logged_at).getTime() - new Date(left.logged_at).getTime(),
  )

  const latest = sorted[0]?.weight_kg
  return latest != null ? Number(latest) : null
}

export function resolveCurrentWeightKg(
  entries: WeightEntry[] | null | undefined,
  fallbackKg?: number | null,
): number | null {
  return getLatestWeightKg(entries) ?? fallbackKg ?? null
}

export function resolveWeightGoal(
  goal: WeightGoalRecord | null | undefined,
  entries: WeightEntry[] | null | undefined,
): WeightGoal | null {
  if (!goal) {
    return null
  }

  const current_weight_kg =
    resolveCurrentWeightKg(entries, goal.start_weight_kg) ?? goal.start_weight_kg

  return {
    ...goal,
    current_weight_kg,
  }
}
