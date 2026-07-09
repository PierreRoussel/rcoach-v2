import { describe, expect, it } from 'vitest'

import { parseAdminRecentLists } from '@/lib/admin/recent-lists'

describe('parseAdminRecentLists', () => {
  it('parses recent users and subscriptions', () => {
    const parsed = parseAdminRecentLists({
      recentUsers: [
        {
          id: 'u1',
          displayName: 'Alice',
          role: 'athlete',
          createdAt: '2026-01-01T00:00:00.000Z',
          onboardingCompletedAt: null,
          isPremium: false,
        },
      ],
      recentSubscriptions: [
        {
          id: 's1',
          userId: 'u1',
          displayName: 'Alice',
          tier: 'premium',
          status: 'trialing',
          billingPeriod: 'monthly',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          currentPeriodEnd: '2026-01-09T00:00:00.000Z',
          trialConsumedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      limit: 25,
    })

    expect(parsed.recentUsers).toHaveLength(1)
    expect(parsed.recentSubscriptions[0]?.status).toBe('trialing')
  })
})
