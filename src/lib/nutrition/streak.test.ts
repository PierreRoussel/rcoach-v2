import { describe, expect, it } from 'vitest'

import {
  aggregateNutritionDays,
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
    })
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
