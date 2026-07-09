import { describe, expect, it } from 'vitest'

import { subscriptionDisplayStatus } from '@/lib/subscription/subscription-labels'

describe('subscriptionDisplayStatus', () => {
  it('shows unified Premium label during trial', () => {
    const display = subscriptionDisplayStatus({
      tier: 'premium',
      status: 'trialing',
      billing_period: 'monthly',
      current_period_end: '2026-06-15T10:00:00.000Z',
    })

    expect(display.statusLabel).toBe('Premium')
    expect(display.billingLabel).toBe('Mensuel')
    expect(display.periodContext).toContain('Se termine le')
  })

  it('shows renewal copy for active paid subscription', () => {
    const display = subscriptionDisplayStatus({
      tier: 'premium',
      status: 'active',
      billing_period: 'annual',
      current_period_end: '2026-12-01T10:00:00.000Z',
    })

    expect(display.statusLabel).toBe('Premium')
    expect(display.billingLabel).toBe('Annuel')
    expect(display.periodContext).toContain('Renouvellement le')
  })
})
