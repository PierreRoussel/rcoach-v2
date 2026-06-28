import { describe, expect, it } from 'vitest'

import type { WeightGoal } from '@/lib/goals/weight-goal'
import { hasNutritionSetup, isNutritionConfigured } from '@/lib/nutrition/onboarding'
import type { NutritionSettings } from '@/lib/nutrition/types'

const baseSettings: NutritionSettings = {
  user_id: 'user-1',
  daily_calorie_target: 2200,
  carbs_pct: 40,
  protein_pct: 30,
  fat_pct: 30,
  breakfast_pct: 20,
  lunch_pct: 35,
  snack_pct: 10,
  dinner_pct: 35,
  activity_level: 'moderate',
  calorie_adjustment: 0,
  tdee_calculated: 2500,
  onboarded_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const weightGoal: WeightGoal = {
  user_id: 'user-1',
  target_weight_kg: 75,
  start_weight_kg: 80,
  current_weight_kg: 79,
  goal_type: 'lose',
  last_milestone_step: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('isNutritionConfigured', () => {
  it('returns true for complete nutrition settings without onboarded_at', () => {
    expect(isNutritionConfigured(baseSettings)).toBe(true)
  })

  it('returns false when nutrition is incomplete', () => {
    expect(isNutritionConfigured(null)).toBe(false)
  })
})

describe('hasNutritionSetup', () => {
  it('returns true when a weight goal exists even without nutrition', () => {
    expect(hasNutritionSetup(null, weightGoal)).toBe(true)
  })

  it('returns true when nutrition is onboarded', () => {
    expect(
      hasNutritionSetup(
        { ...baseSettings, onboarded_at: '2026-01-01T00:00:00.000Z' },
        null,
      ),
    ).toBe(true)
  })

  it('returns true for complete nutrition settings without onboarded_at', () => {
    expect(hasNutritionSetup(baseSettings, null)).toBe(true)
  })

  it('returns false when nothing is configured', () => {
    expect(hasNutritionSetup(null, null)).toBe(false)
  })
})
