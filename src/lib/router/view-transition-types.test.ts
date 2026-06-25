import { describe, expect, it } from 'vitest'

import {
  getMainTabIndex,
  resolveViewTransitionTypes,
} from '@/lib/router/view-transition-types'

describe('view-transition-types', () => {
  it('maps main tab paths to nav indices', () => {
    expect(getMainTabIndex('/app')).toBe(0)
    expect(getMainTabIndex('/app/')).toBe(0)
    expect(getMainTabIndex('/app/sessions')).toBe(1)
    expect(getMainTabIndex('/app/stats')).toBe(2)
    expect(getMainTabIndex('/app/profile')).toBe(3)
    expect(getMainTabIndex('/app/stats/exercises/abc')).toBeNull()
    expect(getMainTabIndex('/app/workout/active')).toBeNull()
  })

  it('slides between main tabs and fades on drill-down', () => {
    expect(resolveViewTransitionTypes('/app', '/app/sessions')).toEqual(['slide-left'])
    expect(resolveViewTransitionTypes('/app/stats', '/app')).toEqual(['slide-right'])
    expect(resolveViewTransitionTypes('/app/stats', '/app/stats/exercises/abc')).toEqual(['fade'])
    expect(resolveViewTransitionTypes('/app/stats/exercises/abc', '/app/stats')).toEqual(['fade'])
  })
})
