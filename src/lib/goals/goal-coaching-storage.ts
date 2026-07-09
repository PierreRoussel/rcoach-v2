import { toDateKey } from '@/lib/nutrition/dates'

export const GOAL_COACHING_CHECKED_PREFIX = 'goal-coaching-checked:'
export const GOAL_COACHING_SNOOZE_UNTIL_KEY = 'goal-coaching-snooze-until'
export const GOAL_COACHING_REFUSAL_COUNT_KEY = 'goal-coaching-refusal-count'
export const GOAL_COACHING_SNOOZE_DAYS_SHORT = 5
export const GOAL_COACHING_SNOOZE_DAYS_LONG = 30

export type GoalCoachingStorageState = {
  snoozeUntil: string | null
  refusalCount: number
}

export function goalCoachingCheckedKey(date = new Date()): string {
  return `${GOAL_COACHING_CHECKED_PREFIX}${toDateKey(date)}`
}

export function readGoalCoachingCheckedToday(date = new Date()): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false
  }

  return sessionStorage.getItem(goalCoachingCheckedKey(date)) === '1'
}

export function markGoalCoachingCheckedToday(date = new Date()): void {
  if (typeof sessionStorage === 'undefined') {
    return
  }

  sessionStorage.setItem(goalCoachingCheckedKey(date), '1')
}

export function readGoalCoachingStorage(): GoalCoachingStorageState {
  if (typeof localStorage === 'undefined') {
    return { snoozeUntil: null, refusalCount: 0 }
  }

  const snoozeUntil = localStorage.getItem(GOAL_COACHING_SNOOZE_UNTIL_KEY)
  const refusalRaw = localStorage.getItem(GOAL_COACHING_REFUSAL_COUNT_KEY)
  const refusalCount = refusalRaw ? Number.parseInt(refusalRaw, 10) : 0

  return {
    snoozeUntil,
    refusalCount: Number.isFinite(refusalCount) ? refusalCount : 0,
  }
}

export function isGoalCoachingSnoozeActive(
  storage: GoalCoachingStorageState,
  now = new Date(),
): boolean {
  if (!storage.snoozeUntil) {
    return false
  }

  const until = new Date(storage.snoozeUntil)
  if (Number.isNaN(until.getTime())) {
    return false
  }

  return until.getTime() > now.getTime()
}

export function writeGoalCoachingSnooze(days: number, now = new Date()): string {
  const until = new Date(now)
  until.setDate(until.getDate() + days)
  const iso = until.toISOString()

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GOAL_COACHING_SNOOZE_UNTIL_KEY, iso)
  }

  return iso
}

export function incrementGoalCoachingRefusalCount(): number {
  const storage = readGoalCoachingStorage()
  const next = storage.refusalCount + 1

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GOAL_COACHING_REFUSAL_COUNT_KEY, String(next))
  }

  return next
}

export function resetGoalCoachingRefusalCount(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(GOAL_COACHING_REFUSAL_COUNT_KEY)
  }
}

export function clearGoalCoachingSnooze(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(GOAL_COACHING_SNOOZE_UNTIL_KEY)
  }
}

export function resetGoalCoachingDevState(): void {
  clearGoalCoachingSnooze()
  resetGoalCoachingRefusalCount()

  if (typeof sessionStorage === 'undefined') {
    return
  }

  const keys: string[] = []
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index)
    if (key?.startsWith(GOAL_COACHING_CHECKED_PREFIX)) {
      keys.push(key)
    }
  }

  keys.forEach((key) => sessionStorage.removeItem(key))
}
