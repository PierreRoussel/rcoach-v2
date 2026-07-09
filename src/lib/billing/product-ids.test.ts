import { describe, expect, it } from 'vitest'

import {
  billingPeriodFromPlayProductId,
  playProductIdForBillingPeriod,
  readPlayProductIds,
} from './product-ids'

describe('play product ids', () => {
  it('maps billing periods to default product ids', () => {
    const ids = readPlayProductIds()
    expect(playProductIdForBillingPeriod('monthly', ids)).toBe('rcoach_premium_monthly')
    expect(playProductIdForBillingPeriod('annual', ids)).toBe('rcoach_premium_annual')
  })

  it('resolves billing period from product id', () => {
    const ids = { monthly: 'monthly-id', annual: 'annual-id' }
    expect(billingPeriodFromPlayProductId('monthly-id', ids)).toBe('monthly')
    expect(billingPeriodFromPlayProductId('annual-id', ids)).toBe('annual')
    expect(billingPeriodFromPlayProductId('unknown', ids)).toBeNull()
  })
})
