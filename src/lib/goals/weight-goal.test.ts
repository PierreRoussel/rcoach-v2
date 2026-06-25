import { describe, expect, it } from 'vitest'

import {
  adjustWeightKg,
  inferWeightGoalType,
  milestoneStepFromProgress,
  progressKgSinceStart,
  projectWeightGoalCompletion,
  remainingKgToTarget,
  shouldSuggestCalorieUpdate,
  suggestCalorieTarget,
} from '@/lib/goals/weight-goal'
import type { NutritionSettings } from '@/lib/nutrition/types'

const baseSettings: NutritionSettings = {
  user_id: 'user-1',
  daily_calorie_target: 2500,
  carbs_pct: 40,
  protein_pct: 30,
  fat_pct: 30,
  breakfast_pct: 20,
  lunch_pct: 35,
  snack_pct: 10,
  dinner_pct: 35,
  sex: 'male',
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity_level: 'moderate',
  goal: 'maintain',
  calorie_adjustment: 0,
  tdee_calculated: 2500,
  onboarded_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('inferWeightGoalType', () => {
  it('detects weight loss', () => {
    expect(inferWeightGoalType(80, 75)).toBe('lose')
  })

  it('detects weight gain', () => {
    expect(inferWeightGoalType(70, 75)).toBe('gain')
  })

  it('detects maintenance when target is close', () => {
    expect(inferWeightGoalType(80, 80.1)).toBe('maintain')
  })
})

describe('progress and milestones', () => {
  it('tracks loss progress as positive values', () => {
    const progress = progressKgSinceStart({
      goal_type: 'lose',
      start_weight_kg: 80,
      current_weight_kg: 78.5,
    })

    expect(progress).toBe(1.5)
    expect(milestoneStepFromProgress(progress, 'lose')).toBe(3)
  })

  it('tracks gain progress as positive values', () => {
    const progress = progressKgSinceStart({
      goal_type: 'gain',
      start_weight_kg: 70,
      current_weight_kg: 71,
    })

    expect(progress).toBe(1)
    expect(milestoneStepFromProgress(progress, 'gain')).toBe(2)
  })

  it('adjusts weight in 100g steps', () => {
    expect(adjustWeightKg(79, -1)).toBe(78.9)
    expect(adjustWeightKg(79, 1)).toBe(79.1)
  })
})

describe('calorie suggestion', () => {
  it('suggests lower calories for a loss goal', () => {
    const suggestion = suggestCalorieTarget(baseSettings, 'lose', 80)

    expect(suggestion).not.toBeNull()
    expect(suggestion!.suggestedCalories).toBeLessThan(baseSettings.daily_calorie_target)
    expect(shouldSuggestCalorieUpdate(suggestion)).toBe(true)
  })
})

describe('projectWeightGoalCompletion', () => {
  const loseGoal = {
    goal_type: 'lose' as const,
    current_weight_kg: 80,
    target_weight_kg: 78,
  }

  it('projects completion date from caloric deficit', () => {
    const settings = {
      ...baseSettings,
      daily_calorie_target: 2000,
      tdee_calculated: 2500,
      weight_kg: 80,
      goal: 'lose' as const,
    }

    const projection = projectWeightGoalCompletion(
      loseGoal,
      settings,
      new Date('2026-01-01T00:00:00.000Z'),
    )

    expect(projection).not.toBeNull()
    expect(projection!.remainingKg).toBe(2)
    expect(projection!.weeklyRateKg).toBeCloseTo(0.4545, 3)
    expect(projection!.projectedDate).not.toBeNull()
  })

  it('returns reached when target is met', () => {
    const projection = projectWeightGoalCompletion(
      {
        goal_type: 'lose',
        current_weight_kg: 78,
        target_weight_kg: 78,
      },
      baseSettings,
    )

    expect(projection?.isReached).toBe(true)
    expect(projection?.remainingKg).toBe(0)
  })

  it('returns null for maintain goals', () => {
    expect(
      projectWeightGoalCompletion(
        {
          goal_type: 'maintain',
          current_weight_kg: 80,
          target_weight_kg: 80,
        },
        baseSettings,
      ),
    ).toBeNull()
  })

  it('computes remaining weight to target', () => {
    expect(
      remainingKgToTarget({
        goal_type: 'lose',
        current_weight_kg: 80,
        target_weight_kg: 78,
      }),
    ).toBe(2)
  })
})
