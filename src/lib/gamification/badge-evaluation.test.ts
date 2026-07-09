import { describe, expect, it } from 'vitest'

import { FALLBACK_BADGE_CATALOG } from '@/lib/gamification/badges'
import {
  evaluateEligibleBadges,
  findNewBadgeKeys,
} from '@/lib/gamification/badge-evaluation'

describe('evaluateEligibleBadges', () => {
  it('returns discipline and session badges from thresholds', () => {
    const keys = evaluateEligibleBadges(
      {
        nutritionStreak: 30,
        workoutWeeklyStreak: 12,
        totalSessions: 50,
        totalVolumeKg: 120_000,
        totalPrCount: 12,
      },
      FALLBACK_BADGE_CATALOG,
    )

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

  it('ignores manual badges', () => {
    const keys = evaluateEligibleBadges(
      {
        nutritionStreak: 0,
        workoutWeeklyStreak: 0,
        totalSessions: 0,
        totalVolumeKg: 0,
        totalPrCount: 0,
      },
      [
        ...FALLBACK_BADGE_CATALOG,
        {
          key: 'manual_event',
          label: 'Événement',
          description: 'Badge manuelle',
          category: 'sessions',
          tier: 'gold',
          icon_name: 'star',
          rule_type: 'manual',
          rule_threshold: null,
          is_active: true,
          sort_order: 999,
        },
      ],
    )

    expect(keys).not.toContain('manual_event')
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
