import { describe, expect, it } from 'vitest'

import { canCreateWorkoutTemplate, hasEntitlement, isPremiumTheme } from '@/lib/subscription/entitlements'

describe('entitlements', () => {
  it('grants premium features only to premium tier', () => {
    expect(hasEntitlement('premium', 'advanced_stats')).toBe(true)
    expect(hasEntitlement('free', 'advanced_stats')).toBe(false)
  })

  it('identifies premium theme', () => {
    expect(isPremiumTheme('pro')).toBe(true)
    expect(isPremiumTheme('sports-candy')).toBe(false)
  })

  it('limits free workout templates to six', () => {
    expect(canCreateWorkoutTemplate('free', 0)).toBe(true)
    expect(canCreateWorkoutTemplate('free', 5)).toBe(true)
    expect(canCreateWorkoutTemplate('free', 6)).toBe(false)
    expect(canCreateWorkoutTemplate('premium', 20)).toBe(true)
  })
})
