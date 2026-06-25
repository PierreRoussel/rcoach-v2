import { describe, expect, it } from 'vitest'

import {
  getMainTabIndex,
  resolveViewTransitionTypes,
  shouldSkipViewTransition,
} from '@/lib/router/view-transition-types'

describe('view-transition-types', () => {
  it('maps main tab paths to nav indices', () => {
    expect(getMainTabIndex('/app')).toBe(0)
    expect(getMainTabIndex('/app/')).toBe(0)
    expect(getMainTabIndex('/app/sessions')).toBe(1)
    expect(getMainTabIndex('/app/profile')).toBe(2)
    expect(getMainTabIndex('/app/stats')).toBeNull()
    expect(getMainTabIndex('/app/stats/exercises/abc')).toBeNull()
    expect(getMainTabIndex('/app/workout/active')).toBeNull()
  })

  it('slides between main tabs and fades on drill-down', () => {
    expect(resolveViewTransitionTypes('/app', '/app/sessions')).toEqual(['slide-left'])
    expect(resolveViewTransitionTypes('/app/profile', '/app')).toEqual(['slide-right'])
    expect(resolveViewTransitionTypes('/app/sessions', '/app/stats/exercises/abc')).toEqual(['fade'])
    expect(resolveViewTransitionTypes('/app/stats/exercises/abc', '/app/sessions')).toEqual(['fade'])
  })

  it('skips view transitions for search-only navigations', () => {
    expect(shouldSkipViewTransition('/app/sessions', '/app/sessions')).toBe(true)
    expect(shouldSkipViewTransition('/app/sessions/', '/app/sessions')).toBe(true)
    expect(resolveViewTransitionTypes('/app/sessions', '/app/sessions')).toBe(false)
    expect(shouldSkipViewTransition('/app/sessions', '/app/profile')).toBe(false)
  })
})
