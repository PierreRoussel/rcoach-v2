import { describe, expect, it } from 'vitest'

import {
  aggregateNutritionDays,
  computeMonthOnTargetSummary,
  computeNutritionLoggingStreak,
} from '@/lib/nutrition/streak'

describe('aggregateNutritionDays', () => {
  it('marks days within target as on_target', () => {
    const map = aggregateNutritionDays(
      [{ logged_date: '2026-06-25', calories: 400 }],
      2000,
    )

    expect(map.get('2026-06-25')).toEqual({
      calories: 400,
      hasLogs: true,
      status: 'on_target',
      loggedMeals: [],
    })
  })

  it('tracks logged meal types per day', () => {
    const map = aggregateNutritionDays(
      [
        { logged_date: '2026-06-25', calories: 300, meal_type: 'breakfast' },
        { logged_date: '2026-06-25', calories: 500, meal_type: 'lunch' },
        { logged_date: '2026-06-25', calories: 200, meal_type: 'breakfast' },
      ],
      2000,
    )

    expect(map.get('2026-06-25')?.loggedMeals).toEqual(['breakfast', 'lunch'])
  })

  it('marks days above target as over_target', () => {
    const map = aggregateNutritionDays(
      [{ logged_date: '2026-06-25', calories: 2500 }],
      2000,
    )

    expect(map.get('2026-06-25')?.status).toBe('over_target')
  })
})

describe('computeNutritionLoggingStreak', () => {
  it('counts consecutive logged days ending today', () => {
    expect(
      computeNutritionLoggingStreak(
        ['2026-06-23', '2026-06-24', '2026-06-25'],
        '2026-06-25',
      ),
    ).toBe(3)
  })

  it('gracefully starts from yesterday when today is empty', () => {
    expect(
      computeNutritionLoggingStreak(
        ['2026-06-23', '2026-06-24'],
        '2026-06-25',
      ),
    ).toBe(2)
  })
})

describe('computeMonthOnTargetSummary', () => {
  it('counts only on_target days in the requested month', () => {
    const map = aggregateNutritionDays(
      [
        { logged_date: '2026-06-01', calories: 1500 },
        { logged_date: '2026-06-02', calories: 2200 },
      ],
      2000,
    )

    expect(computeMonthOnTargetSummary(map, 2026, 5)).toEqual({
      onTargetDays: 1,
      daysInMonth: 30,
    })
  })
})
