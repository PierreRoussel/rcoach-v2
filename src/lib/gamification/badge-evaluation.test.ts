import { describe, expect, it } from 'vitest'

import {
  evaluateEligibleBadges,
  findNewBadgeKeys,
} from '@/lib/gamification/badge-evaluation'

describe('evaluateEligibleBadges', () => {
  it('returns discipline and session badges from thresholds', () => {
    const keys = evaluateEligibleBadges({
      nutritionStreak: 30,
      workoutWeeklyStreak: 12,
      totalSessions: 50,
      totalVolumeKg: 120_000,
      totalPrCount: 12,
    })

    expect(keys).toContain('nutrition_streak_7')
    expect(keys).toContain('nutrition_streak_30')
    expect(keys).toContain('workout_streak_4')
    expect(keys).toContain('workout_streak_12')
    expect(keys).toContain('sessions_10')
    expect(keys).toContain('sessions_50')
    expect(keys).toContain('volume_10k')
    expect(keys).toContain('volume_100k')
    expect(keys).toContain('first_pr')
    expect(keys).toContain('pr_10')
    expect(keys).not.toContain('nutrition_streak_100')
    expect(keys).not.toContain('volume_1m')
  })
})

describe('findNewBadgeKeys', () => {
  it('filters already unlocked badges', () => {
    const result = findNewBadgeKeys(
      ['sessions_10', 'sessions_50', 'first_pr'],
      ['sessions_10'],
    )

    expect(result).toEqual(['sessions_50', 'first_pr'])
  })
})
