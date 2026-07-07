import { describe, expect, it } from 'vitest'

import { hasEntitlement, isPremiumTheme } from '@/lib/subscription/entitlements'

describe('entitlements', () => {
  it('grants premium features only to premium tier', () => {
    expect(hasEntitlement('premium', 'advanced_stats')).toBe(true)
    expect(hasEntitlement('free', 'advanced_stats')).toBe(false)
  })

  it('identifies premium theme', () => {
    expect(isPremiumTheme('pro')).toBe(true)
    expect(isPremiumTheme('sports-candy')).toBe(false)
  })
})
