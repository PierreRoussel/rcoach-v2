import { describe, expect, it } from 'vitest'

import {
  clampFullSwipeOffset,
  resolveFullSwipeOffset,
  shouldTriggerFullSwipeDelete,
} from '@/lib/ui/swipe-delete'

describe('full swipe delete', () => {
  it('clamps offset to the row width', () => {
    expect(clampFullSwipeOffset(-400, 320)).toBe(-336)
    expect(clampFullSwipeOffset(12, 320)).toBe(0)
  })

  it('requires swiping almost the full row width', () => {
    expect(shouldTriggerFullSwipeDelete(-300, 320)).toBe(true)
    expect(shouldTriggerFullSwipeDelete(-200, 320)).toBe(false)
  })

  it('resolves offset from drag delta', () => {
    expect(resolveFullSwipeOffset(0, -180, 320)).toBe(-180)
  })
})
