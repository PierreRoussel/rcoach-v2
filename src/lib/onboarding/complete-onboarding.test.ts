import { describe, expect, it, vi } from 'vitest'

import type { NhostClient } from '@nhost/nhost-js'

import { COMPLETE_MY_ONBOARDING } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { completeAppOnboarding } from '@/lib/onboarding/complete-onboarding'
import { ensureUserProfile } from '@/lib/onboarding/ensure-user-profile'

vi.mock('@/lib/onboarding/ensure-user-profile', () => ({
  ensureUserProfile: vi.fn(),
}))

vi.mock('@/lib/graphql/request', () => ({
  graphqlRequest: vi.fn(),
}))

describe('completeAppOnboarding', () => {
  it('calls complete_my_onboarding as a query', async () => {
    vi.mocked(ensureUserProfile).mockResolvedValue('user-1')
    vi.mocked(graphqlRequest).mockResolvedValueOnce({
      complete_my_onboarding: '2026-01-01T00:00:00.000Z',
    })

    await completeAppOnboarding({} as NhostClient, 'user-1', {
      sex: null,
      age: '',
      heightCm: '',
      waistCm: '',
      weightKg: '',
    })

    expect(graphqlRequest).toHaveBeenCalledWith({}, COMPLETE_MY_ONBOARDING)
  })

  it('does not fall back to a direct onboarding_completed_at update', async () => {
    vi.mocked(ensureUserProfile).mockResolvedValue('user-1')
    vi.mocked(graphqlRequest).mockRejectedValue(
      new Error("field 'complete_my_onboarding' not found in type: 'query_root'"),
    )

    await expect(
      completeAppOnboarding({} as NhostClient, 'user-1', {
        sex: null,
        age: '',
        heightCm: '',
        waistCm: '',
        weightKg: '',
      }),
    ).rejects.toThrow('Impossible de finaliser l\'onboarding')
  })
})
