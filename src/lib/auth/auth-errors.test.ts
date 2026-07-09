import { describe, expect, it } from 'vitest'

import { mapAuthError } from '@/lib/auth/auth-errors'

describe('mapAuthError', () => {
  it('maps disabled-user to a clear French message', () => {
    expect(
      mapAuthError({ body: { error: 'disabled-user', message: 'User is disabled' } }, 'fallback'),
    ).toContain('désactivé')
  })

  it('maps email already used on signup', () => {
    expect(
      mapAuthError({ body: { error: 'email-already-in-use' } }, 'fallback'),
    ).toContain('déjà utilisé')
  })

  it('falls back when error is unknown', () => {
    expect(mapAuthError(new Error('network'), 'Erreur réseau')).toBe('network')
    expect(mapAuthError({}, 'Erreur réseau')).toBe('Erreur réseau')
  })
})
