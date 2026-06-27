import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildOAuthRedirectUrl } from '@/lib/auth/pkce-flow'

describe('buildOAuthRedirectUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the verify route on the current origin', () => {
    vi.stubGlobal('window', { location: { origin: 'https://app.example' } })

    expect(buildOAuthRedirectUrl()).toBe('https://app.example/auth/verify')
  })
})
