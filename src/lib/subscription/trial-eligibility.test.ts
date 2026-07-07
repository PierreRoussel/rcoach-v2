import { describe, expect, it } from 'vitest'

import {
  canStartPremiumTrial,
  hasConsumedPremiumTrial,
  isTrialAlreadyConsumedError,
} from '@/lib/subscription/trial-eligibility'

describe('trial-eligibility', () => {
  it('detects consumed trial from timestamp', () => {
    expect(hasConsumedPremiumTrial(null)).toBe(false)
    expect(hasConsumedPremiumTrial(undefined)).toBe(false)
    expect(hasConsumedPremiumTrial('2026-01-01T00:00:00.000Z')).toBe(true)
  })

  it('allows trial only for free users without prior trial', () => {
    expect(
      canStartPremiumTrial({ isPremium: false, trialConsumedAt: null }),
    ).toBe(true)
    expect(
      canStartPremiumTrial({
        isPremium: false,
        trialConsumedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe(false)
    expect(
      canStartPremiumTrial({ isPremium: true, trialConsumedAt: null }),
    ).toBe(false)
  })

  it('recognizes backend trial guard errors', () => {
    expect(isTrialAlreadyConsumedError(new Error('trial_already_consumed'))).toBe(
      true,
    )
    expect(isTrialAlreadyConsumedError(new Error('network'))).toBe(false)
  })
})
