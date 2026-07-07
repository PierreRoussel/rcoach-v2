import { describe, expect, it } from 'vitest'

import {
  hasOverlayHistoryState,
  isAddBackTrapState,
  isMealBackTrapState,
  shouldLeaveAddPageOnPopState,
  shouldLeaveMealPageOnPopState,
} from '@/hooks/useDietMealBackNavigation'

describe('shouldLeaveMealPageOnPopState', () => {
  it('stays on meal page when popping an overlay back to the meal trap state', () => {
    expect(shouldLeaveMealPageOnPopState({ __dietMealBack: true })).toBe(false)
  })

  it('leaves the meal page when popping past the meal trap state', () => {
    expect(shouldLeaveMealPageOnPopState(null)).toBe(true)
    expect(shouldLeaveMealPageOnPopState({ idx: 1 })).toBe(true)
  })
})

describe('shouldLeaveAddPageOnPopState', () => {
  it('stays on add page when popping an overlay back to the add trap state', () => {
    expect(shouldLeaveAddPageOnPopState({ __dietAddBack: true })).toBe(false)
  })

  it('leaves the add page when popping past the add trap state', () => {
    expect(shouldLeaveAddPageOnPopState(null)).toBe(true)
    expect(shouldLeaveAddPageOnPopState({ idx: 1 })).toBe(true)
  })
})

describe('meal history helpers', () => {
  it('detects meal trap and overlay history markers', () => {
    expect(isMealBackTrapState({ __dietMealBack: true })).toBe(true)
    expect(isAddBackTrapState({ __dietAddBack: true })).toBe(true)
    expect(
      hasOverlayHistoryState({ __dietMealBack: true, 'overlay-:r1:': true }),
    ).toBe(true)
  })
})
