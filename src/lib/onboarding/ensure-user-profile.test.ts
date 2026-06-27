import { describe, expect, it, vi } from 'vitest'

import type { NhostClient } from '@nhost/nhost-js'

import { ensureUserProfile } from '@/lib/onboarding/ensure-user-profile'
import { fetchMyProfile } from '@/lib/graphql/profile-request'

vi.mock('@/lib/graphql/profile-request', () => ({
  fetchMyProfile: vi.fn(),
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
  })

  it('throws when profile stays missing', async () => {
    vi.mocked(fetchMyProfile).mockResolvedValue(null)

    await expect(ensureUserProfile({} as NhostClient, 'user-2')).rejects.toThrow(
      'Profil introuvable',
    )
  })
})
