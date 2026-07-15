import { describe, expect, it } from 'vitest'

import type { WeightEntry } from '@/lib/graphql/operations'
import type { NutritionDayAggregate } from '@/lib/nutrition/streak'
import type { NutritionSettings } from '@/lib/nutrition/types'

import {
  computeObservedAvgKcal14d,
  computeWeightProgressKg,
  findReferenceWeightKg,
  isGoalOldEnough,
  isWeightStagnant,
  resolveDietAdherence14d,
  shouldOfferGoalCoaching,
  suggestIntelligentCalorieAdjustment,
} from './goal-coaching-lifecycle'
import type { GoalCoachingStorageState } from './goal-coaching-storage'

const now = new Date('2026-06-25T12:00:00.000Z')

function entry(daysAgo: number, weightKg: number): WeightEntry {
  const loggedAt = new Date(now)
  loggedAt.setDate(loggedAt.getDate() - daysAgo)
  return {
    id: `entry-${daysAgo}`,
    user_id: 'user-1',
    weight_kg: weightKg,
    logged_at: loggedAt.toISOString(),
    source: 'manual',
  }
}

const baseGoal = {
  user_id: 'user-1',
  goal_type: 'lose' as const,
  start_weight_kg: 80,
  current_weight_kg: 79.9,
  target_weight_kg: 75,
  last_milestone_step: 0,
  projected_completion_at: null,
  projection_computed_at: null,
  projection_weekly_rate_kg: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

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
  onboarded_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const measurements = {
  sex: 'male' as const,
  age: 30,
  height_cm: 180,
  waist_cm: null,
}

const inactiveStorage: GoalCoachingStorageState = {
  snoozeUntil: null,
  refusalCount: 0,
}

describe('findReferenceWeightKg', () => {
  it('returns the latest entry at or before 14 days ago', () => {
    const entries = [entry(20, 80), entry(15, 79.8), entry(10, 79.9)]
    const reference = findReferenceWeightKg(entries, now)
    expect(reference?.weightKg).toBe(79.8)
  })

  it('returns null when no entry is old enough', () => {
    expect(findReferenceWeightKg([entry(5, 80)], now)).toBeNull()
  })
})

describe('computeWeightProgressKg', () => {
  it('measures progress toward lose goal', () => {
    expect(computeWeightProgressKg('lose', 80, 79.5)).toBe(0.5)
  })

  it('measures progress toward gain goal', () => {
    expect(computeWeightProgressKg('gain', 70, 70.3)).toBeCloseTo(0.3, 5)
  })
})

describe('isWeightStagnant', () => {
  it('detects lose stagnation below threshold', () => {
    const entries = [entry(20, 80), entry(14, 79.95)]
    expect(
      isWeightStagnant(
        { ...baseGoal, current_weight_kg: 79.9 },
        entries,
        now,
      ),
    ).toBe(true)
  })

  it('does not flag meaningful lose progress', () => {
    const entries = [entry(20, 80), entry(14, 79.5)]
    expect(
      isWeightStagnant(
        { ...baseGoal, current_weight_kg: 78.8 },
        entries,
        now,
      ),
    ).toBe(false)
  })

  it('skips maintain goals', () => {
    expect(
      isWeightStagnant(
        { ...baseGoal, goal_type: 'maintain' },
        [entry(20, 80)],
        now,
      ),
    ).toBe(false)
  })

  it('skips reached goals', () => {
    expect(
      isWeightStagnant(
        { ...baseGoal, current_weight_kg: 74 },
        [entry(20, 80)],
        now,
      ),
    ).toBe(false)
  })
})

describe('isGoalOldEnough', () => {
  it('requires 14 days since last goal update', () => {
    expect(
      isGoalOldEnough(
        {
          created_at: '2026-06-20T00:00:00.000Z',
          updated_at: '2026-06-20T00:00:00.000Z',
        },
        now,
      ),
    ).toBe(false)

    expect(isGoalOldEnough(baseGoal, now)).toBe(true)
  })
})

describe('shouldOfferGoalCoaching', () => {
  it('offers coaching for stagnant premium lose goal', () => {
    const entries = [entry(20, 80), entry(14, 79.95)]
    expect(
      shouldOfferGoalCoaching({
        isPremium: true,
        goal: { ...baseGoal, current_weight_kg: 79.9 },
        entries,
        remindersEnabled: true,
        storage: inactiveStorage,
        now,
      }),
    ).toBe(true)
  })

  it('skips when snoozed', () => {
    expect(
      shouldOfferGoalCoaching({
        isPremium: true,
        goal: baseGoal,
        entries: [entry(20, 80)],
        remindersEnabled: true,
        storage: {
          snoozeUntil: '2026-07-01T00:00:00.000Z',
          refusalCount: 1,
        },
        now,
      }),
    ).toBe(false)
  })

  it('skips when reminders disabled', () => {
    expect(
      shouldOfferGoalCoaching({
        isPremium: true,
        goal: baseGoal,
        entries: [entry(20, 80)],
        remindersEnabled: false,
        storage: inactiveStorage,
        now,
      }),
    ).toBe(false)
  })
})

describe('resolveDietAdherence14d', () => {
  it('counts logged days in the 14-day window', () => {
    const dayMap = new Map<string, NutritionDayAggregate>()
    for (let index = 0; index < 12; index += 1) {
      const date = new Date(now)
      date.setDate(date.getDate() - index)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      dayMap.set(key, { calories: 2000, hasLogs: true, status: 'on_target' })
    }

    const result = resolveDietAdherence14d(dayMap, now)
    expect(result.loggedDays).toBe(12)
    expect(result.adherent).toBe(true)
  })

  it('flags non-adherent diet below 10 days', () => {
    const dayMap = new Map<string, NutritionDayAggregate>()
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(now)
      date.setDate(date.getDate() - index)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      dayMap.set(key, { calories: 2000, hasLogs: true, status: 'on_target' })
    }

    const result = resolveDietAdherence14d(dayMap, now)
    expect(result.adherent).toBe(false)
  })
})

describe('computeObservedAvgKcal14d', () => {
  it('averages calories on logged days only', () => {
    const dayMap = new Map<string, NutritionDayAggregate>([
      ['2026-06-25', { calories: 2000, hasLogs: true, status: 'on_target' }],
      ['2026-06-24', { calories: 1800, hasLogs: true, status: 'on_target' }],
    ])

    expect(computeObservedAvgKcal14d(dayMap, now)).toBe(1900)
  })
})

describe('suggestIntelligentCalorieAdjustment', () => {
  it('refines calories downward when lose stagnation with high observed intake', () => {
    const suggestion = suggestIntelligentCalorieAdjustment(
      baseSettings,
      measurements,
      { goal_type: 'lose', current_weight_kg: 79.9 },
      2400,
    )

    expect(suggestion).not.toBeNull()
    expect(suggestion!.suggestedCalories).toBeLessThan(baseSettings.daily_calorie_target)
    expect(suggestion!.rationale).toContain('moyenne observée')
  })

  it('refines calories upward when gain stagnation with low observed intake', () => {
    const gainSettings = {
      ...baseSettings,
      daily_calorie_target: 2800,
    }

    const suggestion = suggestIntelligentCalorieAdjustment(
      gainSettings,
      measurements,
      { goal_type: 'gain', current_weight_kg: 71 },
      2500,
    )

    expect(suggestion).not.toBeNull()
    expect(suggestion!.suggestedCalories).toBeGreaterThan(
      gainSettings.daily_calorie_target,
    )
  })
})
