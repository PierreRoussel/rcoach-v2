import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  consumePremiumHomeCelebrationPending,
  markPremiumHomeCelebrationPending,
} from '@/lib/subscription/premium-home-celebration'

describe('premium-home-celebration', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
    })
  })

  it('marks and consumes the pending celebration once', () => {
    expect(consumePremiumHomeCelebrationPending()).toBe(false)

    markPremiumHomeCelebrationPending()
    expect(consumePremiumHomeCelebrationPending()).toBe(true)
    expect(consumePremiumHomeCelebrationPending()).toBe(false)
  })
})
