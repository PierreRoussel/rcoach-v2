import { describe, expect, it, vi } from 'vitest'

import type { NhostClient } from '@nhost/nhost-js'

import { fetchMyProfile } from '@/lib/graphql/profile-request'
import { resolveOnboardingProfileId } from '@/lib/onboarding/resolve-profile-id'

vi.mock('@/lib/graphql/profile-request', () => ({
  fetchMyProfile: vi.fn(),
}))

describe('resolveOnboardingProfileId', () => {
  it('uses cached profile id when available', async () => {
    const nhost = {} as NhostClient

    await expect(
      resolveOnboardingProfileId(nhost, 'user-1', 'cached-profile-id'),
    ).resolves.toBe('cached-profile-id')
  })

  it('falls back to auth user id when profile row is not yet readable', async () => {
    const nhost = {} as NhostClient
    vi.mocked(fetchMyProfile).mockResolvedValue(null)

    await expect(resolveOnboardingProfileId(nhost, 'user-1')).resolves.toBe('user-1')
  })
})
