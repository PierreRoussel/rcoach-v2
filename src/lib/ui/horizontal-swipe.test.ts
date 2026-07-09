import { describe, expect, it } from 'vitest'

import {
  HORIZONTAL_SWIPE_THRESHOLD_PX,
  resolveHorizontalSwipe,
} from '@/lib/ui/horizontal-swipe'

describe('resolveHorizontalSwipe', () => {
  it('ignores vertical-dominant movement', () => {
    expect(resolveHorizontalSwipe(20, 80)).toBeNull()
  })

  it('ignores movement below threshold', () => {
    expect(resolveHorizontalSwipe(30, 0, HORIZONTAL_SWIPE_THRESHOLD_PX)).toBeNull()
  })

  it('resolves left and right swipes', () => {
    expect(resolveHorizontalSwipe(-60, 5)).toBe('left')
    expect(resolveHorizontalSwipe(60, 5)).toBe('right')
  })
})
