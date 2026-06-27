import { describe, expect, it } from 'vitest'

import { buildOAuthProfileUpdates } from '@/lib/auth/sync-oauth-profile'

describe('buildOAuthProfileUpdates', () => {
  it('fills avatar and display name when profile is still generic', () => {
    const changes = buildOAuthProfileUpdates(
      {
        display_name: 'leo',
        avatar_url: null,
      },
      {
        id: 'user-1',
        displayName: 'Leo Br',
        avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
        email: 'leo@example.com',
      },
    )

    expect(changes).toEqual({
      avatar_url: 'https://lh3.googleusercontent.com/a/photo',
      display_name: 'Leo Br',
    })
  })

  it('does not overwrite an existing avatar or custom display name', () => {
    const changes = buildOAuthProfileUpdates(
      {
        display_name: 'Coach Leo',
        avatar_url: 'https://cdn.example/avatar.webp',
      },
      {
        id: 'user-1',
        displayName: 'Leo Br',
        avatarUrl: 'https://lh3.googleusercontent.com/a/photo',
        email: 'leo@example.com',
      },
    )

    expect(changes).toEqual({})
  })
})
