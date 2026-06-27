import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildOAuthRedirectUrl, resolveOAuthRedirectOrigin } from '@/lib/auth/pkce-flow'

describe('buildOAuthRedirectUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('returns the verify route on the current origin', () => {
    vi.stubGlobal('window', { location: { origin: 'https://app.example' } })

    expect(buildOAuthRedirectUrl()).toBe('https://app.example/auth/verify')
  })

  it('uses VITE_OAUTH_REDIRECT_ORIGIN when set', () => {
    vi.stubEnv('VITE_OAUTH_REDIRECT_ORIGIN', 'http://localhost:5173/')
    vi.stubGlobal('window', { location: { origin: 'http://127.0.0.1:5173' } })

    expect(resolveOAuthRedirectOrigin()).toBe('http://localhost:5173')
    expect(buildOAuthRedirectUrl()).toBe('http://localhost:5173/auth/verify')
  })
})
