import { describe, expect, it } from 'vitest'

import {
  resolveWorkoutsNextOffset,
  resolveWorkoutsPageLimit,
} from '@/hooks/useWorkouts'

describe('workouts infinite pagination', () => {
  it('loads 4 items on the first page and 10 afterwards', () => {
    expect(resolveWorkoutsPageLimit(0, 4, 10)).toBe(4)
    expect(resolveWorkoutsPageLimit(4, 4, 10)).toBe(10)
    expect(resolveWorkoutsPageLimit(14, 4, 10)).toBe(10)
  })

  it('advances offset when a full page is returned', () => {
    expect(resolveWorkoutsNextOffset(0, 4, 4, 10)).toBe(4)
    expect(resolveWorkoutsNextOffset(4, 10, 4, 10)).toBe(14)
    expect(resolveWorkoutsNextOffset(14, 10, 4, 10)).toBe(24)
  })

  it('stops when fewer items than requested are returned', () => {
    expect(resolveWorkoutsNextOffset(0, 2, 4, 10)).toBeUndefined()
    expect(resolveWorkoutsNextOffset(4, 7, 4, 10)).toBeUndefined()
  })
})
