import { describe, expect, it, vi } from 'vitest'

import type { NhostClient } from '@nhost/nhost-js'

import { ENSURE_USER_PROFILE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { fetchMyProfile } from '@/lib/graphql/profile-request'
import { ensureUserProfile } from '@/lib/onboarding/ensure-user-profile'

vi.mock('@/lib/graphql/profile-request', () => ({
  fetchMyProfile: vi.fn(),
}))

vi.mock('@/lib/graphql/request', () => ({
  graphqlRequest: vi.fn(),
}))

describe('ensureUserProfile', () => {
  it('returns profile id after fetchMyProfile succeeds', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValueOnce({
      id: 'user-1',
      display_name: 'Leo',
      avatar_url: null,
      role: 'athlete',
      unit_system: 'kg',
      rpe_enabled: false,
      exercise_locale: 'fr',
      friend_code: 'RCOACH-ABC',
      email: 'leo@test.com',
      onboarding_completed_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
    })

    const id = await ensureUserProfile({} as NhostClient, 'user-1')

    expect(id).toBe('user-1')
    expect(graphqlRequest).not.toHaveBeenCalled()
  })

  it('calls ensure_user_profile when the profile row is still missing', async () => {
    vi.mocked(fetchMyProfile)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
    vi.mocked(graphqlRequest).mockResolvedValueOnce({
      ensure_user_profile: 'user-2',
    })

    const id = await ensureUserProfile({} as NhostClient, 'user-2')

    expect(id).toBe('user-2')
    expect(graphqlRequest).toHaveBeenCalledWith({}, ENSURE_USER_PROFILE)
  })

  it('throws when profile stays missing and rpc is unavailable', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValue(null)
    vi.mocked(graphqlRequest).mockRejectedValue(
      new Error("field 'ensure_user_profile' not found in type: 'query_root'"),
    )

    await expect(ensureUserProfile({} as NhostClient, 'user-3')).rejects.toThrow(
      'Profil introuvable',
    )
  })
})
