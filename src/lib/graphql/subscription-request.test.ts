import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NhostClient } from '@nhost/nhost-js'

import {
  GET_MY_SUBSCRIPTION,
  RECONCILE_MY_SUBSCRIPTION,
  START_MY_PREMIUM_TRIAL,
  type Subscription,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { START_TRIAL_NOT_DEPLOYED_MESSAGE } from '@/lib/graphql/schema-errors'
import {
  fetchMySubscription,
  startMyPremiumTrial,
} from '@/lib/graphql/subscription-request'

vi.mock('@/lib/graphql/request', () => ({
  graphqlRequest: vi.fn(),
}))

const freeSubscription: Subscription = {
  id: 'sub-free',
  user_id: 'user-1',
  tier: 'free',
  status: 'active',
  billing_period: null,
  current_period_end: null,
  provider: 'none',
  provider_ref: null,
  trial_consumed_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const premiumSubscription: Subscription = {
  ...freeSubscription,
  id: 'sub-premium',
  tier: 'premium',
  status: 'trialing',
  billing_period: 'monthly',
  trial_consumed_at: '2026-01-02T00:00:00.000Z',
}

describe('fetchMySubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falls back to GET when reconcile field is missing', async () => {
    vi.mocked(graphqlRequest).mockImplementation(async (_nhost, query) => {
      if (query === GET_MY_SUBSCRIPTION) {
        return { subscriptions: [freeSubscription] }
      }

      if (query === RECONCILE_MY_SUBSCRIPTION) {
        throw new Error("field 'reconcile_my_subscription' not found in type: 'query_root'")
      }

      throw new Error(`Unexpected query: ${String(query)}`)
    })

    const result = await fetchMySubscription({} as NhostClient, 'user-1')

    expect(result).toEqual(freeSubscription)
    expect(graphqlRequest).toHaveBeenCalledWith({}, GET_MY_SUBSCRIPTION, {
      userId: 'user-1',
    })
    expect(graphqlRequest).toHaveBeenCalledWith({}, RECONCILE_MY_SUBSCRIPTION)
  })

  it('returns reconciled row when reconcile works', async () => {
    vi.mocked(graphqlRequest).mockImplementation(async (_nhost, query) => {
      if (query === GET_MY_SUBSCRIPTION) {
        return { subscriptions: [freeSubscription] }
      }

      if (query === RECONCILE_MY_SUBSCRIPTION) {
        return { reconcile_my_subscription: [premiumSubscription] }
      }

      throw new Error(`Unexpected query: ${String(query)}`)
    })

    const result = await fetchMySubscription({} as NhostClient, 'user-1')

    expect(result).toEqual(premiumSubscription)
  })
})

describe('startMyPremiumTrial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws START_TRIAL_NOT_DEPLOYED_MESSAGE when start_my_premium_trial is missing', async () => {
    vi.mocked(graphqlRequest).mockRejectedValue(
      new Error("field 'start_my_premium_trial' not found in type: 'mutation_root'"),
    )

    await expect(startMyPremiumTrial({} as NhostClient, 'monthly')).rejects.toThrow(
      START_TRIAL_NOT_DEPLOYED_MESSAGE,
    )

    expect(graphqlRequest).toHaveBeenCalledWith({}, START_MY_PREMIUM_TRIAL, {
      billingPeriod: 'monthly',
    })
  })
})
