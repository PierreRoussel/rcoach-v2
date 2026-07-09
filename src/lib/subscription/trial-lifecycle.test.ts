import { describe, expect, it } from 'vitest'

import {
  getTrialDaysLeft,
  isSubscriptionPeriodActive,
  resolveTrialMilestone,
  shouldExpireTrial,
} from '@/lib/subscription/trial-lifecycle'

describe('trial-lifecycle', () => {
  const now = new Date('2026-06-10T12:00:00.000Z')

  it('computes days left until period end', () => {
    expect(getTrialDaysLeft('2026-06-15T10:00:00.000Z', now)).toBe(5)
    expect(getTrialDaysLeft('2026-06-10T08:00:00.000Z', now)).toBe(0)
  })

  it('detects expired trials', () => {
    expect(
      shouldExpireTrial({
        status: 'trialing',
        current_period_end: '2026-06-09T23:59:59.000Z',
      }, now),
    ).toBe(true)
    expect(
      shouldExpireTrial({
        status: 'trialing',
        current_period_end: '2026-06-15T10:00:00.000Z',
      }, now),
    ).toBe(false)
  })

  it('treats premium as inactive after period end', () => {
    expect(
      isSubscriptionPeriodActive({
        tier: 'premium',
        status: 'trialing',
        current_period_end: '2026-06-09T23:59:59.000Z',
      }, now),
    ).toBe(false)
    expect(
      isSubscriptionPeriodActive({
        tier: 'premium',
        status: 'trialing',
        current_period_end: '2026-06-15T10:00:00.000Z',
      }, now),
    ).toBe(true)
  })

  it('resolves trial milestones', () => {
    expect(
      resolveTrialMilestone({
        tier: 'premium',
        status: 'trialing',
        current_period_end: '2026-06-15T10:00:00.000Z',
      }, now),
    ).toBe('j5')
    expect(
      resolveTrialMilestone({
        tier: 'premium',
        status: 'trialing',
        current_period_end: '2026-06-12T10:00:00.000Z',
      }, now),
    ).toBe('j2')
    expect(
      resolveTrialMilestone({
        tier: 'free',
        status: 'canceled',
        current_period_end: null,
      }, now),
    ).toBe(null)
  })
})
