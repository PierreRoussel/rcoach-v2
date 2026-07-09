import { Capacitor } from '@capacitor/core'

export type BillingChannel = 'play' | 'stripe' | 'none'

export function resolveBillingChannel(): BillingChannel {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return 'play'
  }

  if (typeof window !== 'undefined') {
    return 'stripe'
  }

  return 'none'
}

export function isBillingAvailable(): boolean {
  return resolveBillingChannel() !== 'none'
}
