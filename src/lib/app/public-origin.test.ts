import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolvePublicAppOrigin } from './public-origin'

describe('resolvePublicAppOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('prefers VITE_PUBLIC_APP_URL when set', () => {
    vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://rcoach.fr/')
    vi.stubGlobal('window', { location: { origin: 'https://localhost' } })

    expect(resolvePublicAppOrigin()).toBe('https://rcoach.fr')
  })

  it('falls back to production when origin is Capacitor localhost', () => {
    vi.stubGlobal('window', { location: { origin: 'https://localhost' } })

    expect(resolvePublicAppOrigin()).toBe('https://rcoach.fr')
  })

  it('keeps the current origin on the production web app', () => {
    vi.stubGlobal('window', { location: { origin: 'https://rcoach.fr' } })

    expect(resolvePublicAppOrigin()).toBe('https://rcoach.fr')
  })
})
