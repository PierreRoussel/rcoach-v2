import { describe, expect, it, vi } from 'vitest'

import type { NhostClient } from '@nhost/nhost-js'

import { ENSURE_USER_PROFILE } from '@/lib/graphql/operations'
import { ensureUserProfile } from '@/lib/onboarding/ensure-user-profile'
import { fetchMyProfile } from '@/lib/graphql/profile-request'
import { graphqlRequest } from '@/lib/graphql/request'

vi.mock('@/lib/graphql/request', () => ({
  graphqlRequest: vi.fn(),
}))

vi.mock('@/lib/graphql/profile-request', () => ({
  fetchMyProfile: vi.fn(),
}))

describe('ensureUserProfile', () => {
  it('returns profile id from ensure_user_profile mutation', async () => {
    vi.mocked(graphqlRequest).mockResolvedValueOnce({
      ensure_user_profile: 'user-1',
    })

    const id = await ensureUserProfile({} as NhostClient, 'user-1')

    expect(id).toBe('user-1')
    expect(graphqlRequest).toHaveBeenCalledWith({}, ENSURE_USER_PROFILE)
  })

  it('falls back to fetchMyProfile when mutation is unavailable', async () => {
    vi.mocked(graphqlRequest).mockRejectedValueOnce(
      new Error("field 'ensure_user_profile' not found in type: 'query_root'"),
    )
    vi.mocked(fetchMyProfile).mockResolvedValueOnce({
      id: 'user-2',
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

    const id = await ensureUserProfile({} as NhostClient, 'user-2')

    expect(id).toBe('user-2')
  })
})
