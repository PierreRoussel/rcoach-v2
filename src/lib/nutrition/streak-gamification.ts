import { addDays } from '@/lib/nutrition/dates'
import { getMilestoneForStreak } from '@/lib/nutrition/streak-milestones'
import type { StreakMilestone } from '@/lib/nutrition/streak-milestones'

export type RecoveryState = {
  frozenStreak: number
  progress: number
  startedOn: string
}

export type MissedDayState =
  | { kind: 'ok' }
  | { kind: 'recovery_eligible'; frozenStreak: number }
  | { kind: 'broken' }

export type StreakEvent =
  | {
      kind: 'celebration'
      streak: number
      milestone: StreakMilestone | null
      firstLogToday: boolean
    }
  | { kind: 'recovery_progress'; progress: number; frozenStreak: number }
  | { kind: 'recovery_complete'; streak: number }
  | { kind: 'none' }

export function isEligibleSameDayLog(loggedDate: string, today: string): boolean {
  return loggedDate === today
}

export function toValidatedDateSet(dates: Iterable<string>): Set<string> {
  return new Set(dates)
}

export function countConsecutiveStreakEndingOn(
  validatedDates: Set<string>,
  endDate: string,
): number {
  let streak = 0
  let cursor = endDate

  while (validatedDates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

export function computeActiveStreak(validatedDates: Set<string>, today: string): number {
  const anchor = getActiveStreakAnchor(validatedDates, today)
  if (!anchor) {
    return 0
  }

  return countConsecutiveStreakEndingOn(validatedDates, anchor)
}

export function getActiveStreakAnchor(
  validatedDates: Set<string>,
  today: string,
): string | null {
  if (validatedDates.has(today)) {
    return today
  }

  if (validatedDates.has(addDays(today, -1))) {
    return addDays(today, -1)
  }

  return null
}

export function getLatestValidatedDate(validatedDates: Set<string>): string | null {
  if (validatedDates.size === 0) {
    return null
  }

  return [...validatedDates].sort().at(-1) ?? null
}

export function getLastStreakDay(
  validatedDates: Set<string>,
  recovery: RecoveryState | null,
  today: string,
): string | null {
  const anchor = getActiveStreakAnchor(validatedDates, today)
  if (anchor) {
    return anchor
  }

  if (recovery && recovery.progress < 2) {
    return addDays(recovery.startedOn, -1)
  }

  const missedState = detectMissedDayState(validatedDates, today)
  if (missedState.kind === 'recovery_eligible') {
    return addDays(today, -2)
  }

  return getLatestValidatedDate(validatedDates)
}

export function detectMissedDayState(
  validatedDates: Set<string>,
  today: string,
): MissedDayState {
  const yesterday = addDays(today, -1)
  const dayBeforeYesterday = addDays(today, -2)

  if (validatedDates.has(today) || validatedDates.has(yesterday)) {
    return { kind: 'ok' }
  }

  if (validatedDates.has(dayBeforeYesterday)) {
    const frozenStreak = countConsecutiveStreakEndingOn(
      validatedDates,
      dayBeforeYesterday,
    )

    if (frozenStreak > 0) {
      return { kind: 'recovery_eligible', frozenStreak }
    }
  }

  return { kind: 'broken' }
}

export function computeDisplayStreak(
  validatedDates: Set<string>,
  recovery: RecoveryState | null,
  today: string,
): { streak: number; isFrozen: boolean; recoveryProgress: number | null } {
  if (recovery && recovery.progress < 2) {
    return {
      streak: recovery.frozenStreak,
      isFrozen: true,
      recoveryProgress: recovery.progress,
    }
  }

  return {
    streak: computeActiveStreak(validatedDates, today),
    isFrozen: false,
    recoveryProgress: null,
  }
}

export function shouldShowRecoveryDialog(
  missedState: MissedDayState,
  recovery: RecoveryState | null,
  dismissedKey: string | null,
  today: string,
): boolean {
  if (missedState.kind !== 'recovery_eligible') {
    return false
  }

  if (recovery) {
    return false
  }

  if (dismissedKey === today) {
    return false
  }

  return true
}

export function createRecoveryState(frozenStreak: number, today: string): RecoveryState {
  return {
    frozenStreak,
    progress: 0,
    startedOn: today,
  }
}

export function resolveEffectiveRecovery(
  validatedDates: Set<string>,
  recovery: RecoveryState | null,
  today: string,
): RecoveryState | null {
  if (recovery) {
    if (recovery.progress >= 2) {
      return null
    }

    if (!isRecoveryExpired(recovery, validatedDates, today)) {
      return recovery
    }
  }

  const missedState = detectMissedDayState(validatedDates, today)
  if (missedState.kind === 'recovery_eligible') {
    return createRecoveryState(missedState.frozenStreak, today)
  }

  return null
}

export function isRecoveryExpired(
  recovery: RecoveryState,
  validatedDates: Set<string>,
  today: string,
): boolean {
  if (recovery.progress >= 2) {
    return false
  }

  const day1 = recovery.startedOn
  const day2 = addDays(day1, 1)

  if (today > day1 && recovery.progress === 0 && !validatedDates.has(day1)) {
    return true
  }

  if (today > day2 && recovery.progress === 1 && !validatedDates.has(day2)) {
    return true
  }

  if (today > addDays(day2, 1) && recovery.progress < 2) {
    return true
  }

  return false
}

export type ReconcileResult = {
  recovery: RecoveryState | null
  shouldOpenRecoveryDialog: boolean
  frozenStreak?: number
}

export function reconcileStreakState(
  validatedDates: Set<string>,
  recovery: RecoveryState | null,
  today: string,
): ReconcileResult {
  if (recovery && isRecoveryExpired(recovery, validatedDates, today)) {
    recovery = null
  }

  if (recovery) {
    return { recovery, shouldOpenRecoveryDialog: false }
  }

  const missedState = detectMissedDayState(validatedDates, today)

  if (missedState.kind === 'recovery_eligible') {
    return {
      recovery: createRecoveryState(missedState.frozenStreak, today),
      shouldOpenRecoveryDialog: true,
      frozenStreak: missedState.frozenStreak,
    }
  }

  return { recovery: null, shouldOpenRecoveryDialog: false }
}

export function applyDayValidation(
  validatedDates: Set<string>,
  recovery: RecoveryState | null,
  today: string,
  options: { hadEntriesBefore: boolean },
): {
  validatedDates: Set<string>
  recovery: RecoveryState | null
  event: StreakEvent
  isNewValidation: boolean
} {
  if (validatedDates.has(today)) {
    return {
      validatedDates,
      recovery,
      event: { kind: 'none' },
      isNewValidation: false,
    }
  }

  const nextValidated = new Set(validatedDates)
  nextValidated.add(today)

  if (recovery && recovery.progress < 2) {
    const newProgress = recovery.progress + 1

    if (newProgress >= 2) {
      return {
        validatedDates: nextValidated,
        recovery: null,
        event: {
          kind: 'recovery_complete',
          streak: recovery.frozenStreak + 2,
        },
        isNewValidation: true,
      }
    }

    return {
      validatedDates: nextValidated,
      recovery: { ...recovery, progress: newProgress },
      event: {
        kind: 'recovery_progress',
        progress: newProgress,
        frozenStreak: recovery.frozenStreak,
      },
      isNewValidation: true,
    }
  }

  const streak = computeActiveStreak(nextValidated, today)

  return {
    validatedDates: nextValidated,
    recovery,
    event: {
      kind: 'celebration',
      streak,
      milestone: getMilestoneForStreak(streak),
      firstLogToday: !options.hadEntriesBefore,
    },
    isNewValidation: true,
  }
}
