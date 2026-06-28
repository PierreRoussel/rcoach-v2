import type { WeightGoal } from '@/lib/goals/weight-goal'

import type { NutritionSettings } from './types'

export function isNutritionConfigured(
  settings: NutritionSettings | null | undefined,
) {
  if (settings?.onboarded_at) {
    return true
  }

  return (
    settings != null &&
    settings.daily_calorie_target > 0 &&
    settings.weight_kg != null &&
    settings.activity_level != null
  )
}

export function hasNutritionSetup(
  settings: NutritionSettings | null | undefined,
  weightGoal?: WeightGoal | null,
) {
  if (weightGoal) {
    return true
  }

  return isNutritionConfigured(settings)
}
