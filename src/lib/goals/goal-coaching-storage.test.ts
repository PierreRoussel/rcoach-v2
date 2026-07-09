import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearGoalCoachingSnooze,
  GOAL_COACHING_REFUSAL_COUNT_KEY,
  GOAL_COACHING_SNOOZE_DAYS_LONG,
  GOAL_COACHING_SNOOZE_DAYS_SHORT,
  GOAL_COACHING_SNOOZE_UNTIL_KEY,
  goalCoachingCheckedKey,
  incrementGoalCoachingRefusalCount,
  isGoalCoachingSnoozeActive,
  markGoalCoachingCheckedToday,
  readGoalCoachingCheckedToday,
  readGoalCoachingRemindersDisabled,
  readGoalCoachingStorage,
  resetGoalCoachingDevState,
  resetGoalCoachingRefusalCount,
  setGoalCoachingRemindersDisabled,
  writeGoalCoachingSnooze,
} from './goal-coaching-storage'

const now = new Date('2026-06-25T12:00:00.000Z')

function stubBrowserStorage() {
  const sessionStore = new Map<string, string>()
  const localStore = new Map<string, string>()

  vi.stubGlobal('sessionStorage', {
    get length() {
      return sessionStore.size
    },
    key: (index: number) => Array.from(sessionStore.keys())[index] ?? null,
    getItem: (key: string) => sessionStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      sessionStore.set(key, value)
    },
    removeItem: (key: string) => {
      sessionStore.delete(key)
    },
    clear: () => {
      sessionStore.clear()
    },
  })

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => localStore.get(key) ?? null,
    setItem: (key: string, value: string) => {
      localStore.set(key, value)
    },
    removeItem: (key: string) => {
      localStore.delete(key)
    },
    clear: () => {
      localStore.clear()
    },
  })
}

beforeEach(() => {
  stubBrowserStorage()
})

afterEach(() => {
  resetGoalCoachingDevState()
  vi.unstubAllGlobals()
})

describe('goal-coaching-storage', () => {
  it('marks daily check in sessionStorage', () => {
    expect(readGoalCoachingCheckedToday(now)).toBe(false)
    markGoalCoachingCheckedToday(now)
    expect(readGoalCoachingCheckedToday(now)).toBe(true)
    expect(sessionStorage.getItem(goalCoachingCheckedKey(now))).toBe('1')
  })

  it('tracks refusal count', () => {
    expect(incrementGoalCoachingRefusalCount()).toBe(1)
    expect(incrementGoalCoachingRefusalCount()).toBe(2)
    expect(readGoalCoachingStorage().refusalCount).toBe(2)
    resetGoalCoachingRefusalCount()
    expect(readGoalCoachingStorage().refusalCount).toBe(0)
  })

  it('writes short and long snooze windows', () => {
    writeGoalCoachingSnooze(GOAL_COACHING_SNOOZE_DAYS_SHORT, now)
    expect(
      isGoalCoachingSnoozeActive(readGoalCoachingStorage(), now),
    ).toBe(true)

    clearGoalCoachingSnooze()
    const longUntil = writeGoalCoachingSnooze(GOAL_COACHING_SNOOZE_DAYS_LONG, now)
    expect(localStorage.getItem(GOAL_COACHING_SNOOZE_UNTIL_KEY)).toBe(longUntil)
    expect(
      isGoalCoachingSnoozeActive(readGoalCoachingStorage(), now),
    ).toBe(true)
  })

  it('resets dev state', () => {
    markGoalCoachingCheckedToday(now)
    writeGoalCoachingSnooze(5, now)
    incrementGoalCoachingRefusalCount()
    setGoalCoachingRemindersDisabled(true)
    resetGoalCoachingDevState()

    expect(readGoalCoachingCheckedToday(now)).toBe(false)
    expect(localStorage.getItem(GOAL_COACHING_SNOOZE_UNTIL_KEY)).toBeNull()
    expect(localStorage.getItem(GOAL_COACHING_REFUSAL_COUNT_KEY)).toBeNull()
    expect(readGoalCoachingRemindersDisabled()).toBe(false)
  })

  it('stores reminders opt-out locally before migration deploy', () => {
    expect(readGoalCoachingRemindersDisabled()).toBe(false)
    setGoalCoachingRemindersDisabled(true)
    expect(readGoalCoachingRemindersDisabled()).toBe(true)
  })
})
