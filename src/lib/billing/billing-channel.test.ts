import { afterEach, describe, expect, it, vi } from 'vitest'

describe('resolveBillingChannel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('uses Google Play on native Android', async () => {
    vi.doMock('@capacitor/core', () => ({
      Capacitor: {
        isNativePlatform: () => true,
        getPlatform: () => 'android',
      },
    }))

    const { resolveBillingChannel } = await import('./billing-channel')
    expect(resolveBillingChannel()).toBe('play')
  })

  it('uses Stripe on web', async () => {
    vi.stubGlobal('window', {})
    vi.doMock('@capacitor/core', () => ({
      Capacitor: {
        isNativePlatform: () => false,
        getPlatform: () => 'web',
      },
    }))

    const { resolveBillingChannel } = await import('./billing-channel')
    expect(resolveBillingChannel()).toBe('stripe')
  })
})
