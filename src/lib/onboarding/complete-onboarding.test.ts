import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { NhostClient } from '@nhost/nhost-js'

import {
  COMPLETE_MY_ONBOARDING,
  UPDATE_MY_PROFILE,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { ONBOARDING_NOT_DEPLOYED_MESSAGE } from '@/lib/graphql/schema-errors'
import { completeAppOnboarding } from '@/lib/onboarding/complete-onboarding'
import { ensureUserProfile } from '@/lib/onboarding/ensure-user-profile'

vi.mock('@/lib/onboarding/ensure-user-profile', () => ({
  ensureUserProfile: vi.fn(),
}))

vi.mock('@/lib/graphql/request', () => ({
  graphqlRequest: vi.fn(),
}))

const emptyForm = {
  sex: null,
  age: '',
  heightCm: '',
  waistCm: '',
  weightKg: '',
} as const

describe('completeAppOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureUserProfile).mockResolvedValue('user-1')
  })

  it('calls complete_my_onboarding as a query', async () => {
    vi.mocked(graphqlRequest).mockResolvedValueOnce({
      complete_my_onboarding: '2026-01-01T00:00:00.000Z',
    })

    await completeAppOnboarding({} as NhostClient, 'user-1', emptyForm)

    expect(graphqlRequest).toHaveBeenCalledWith({}, COMPLETE_MY_ONBOARDING)
  })

  it('falls back to onboarding_completed_at update when the rpc is missing', async () => {
    vi.mocked(graphqlRequest).mockImplementation(async (_nhost, query) => {
      if (query === COMPLETE_MY_ONBOARDING) {
        throw new Error("field 'complete_my_onboarding' not found in type: 'query_root'")
      }

      if (query === UPDATE_MY_PROFILE) {
        return {
          update_profiles_by_pk: {
            id: 'user-1',
            onboarding_completed_at: '2026-01-01T00:00:00.000Z',
          },
        }
      }

      throw new Error(`Unexpected query: ${String(query)}`)
    })

    await completeAppOnboarding({} as NhostClient, 'user-1', emptyForm)

    expect(graphqlRequest).toHaveBeenCalledWith({}, UPDATE_MY_PROFILE, {
      id: 'user-1',
      changes: { onboarding_completed_at: expect.any(String) },
    })
  })

  it('throws when neither rpc nor update path is available', async () => {
    vi.mocked(graphqlRequest).mockImplementation(async (_nhost, query) => {
      if (query === COMPLETE_MY_ONBOARDING) {
        throw new Error("field 'complete_my_onboarding' not found in type: 'query_root'")
      }

      if (query === UPDATE_MY_PROFILE) {
        throw new Error("field 'onboarding_completed_at' not found in type: 'profiles_set_input'")
      }

      throw new Error(`Unexpected query: ${String(query)}`)
    })

    await expect(
      completeAppOnboarding({} as NhostClient, 'user-1', emptyForm),
    ).rejects.toThrow(ONBOARDING_NOT_DEPLOYED_MESSAGE)
  })
})
