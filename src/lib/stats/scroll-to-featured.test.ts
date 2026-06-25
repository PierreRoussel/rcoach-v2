import { describe, expect, it, beforeEach, vi } from 'vitest'

import {
  consumeStatsScrollToFeatured,
  markStatsScrollToFeatured,
} from '@/lib/stats/scroll-to-featured'

describe('scroll-to-featured session flag', () => {
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

  it('marks and consumes the scroll intent once', () => {
    markStatsScrollToFeatured()
    expect(consumeStatsScrollToFeatured()).toBe(true)
    expect(consumeStatsScrollToFeatured()).toBe(false)
  })
})
