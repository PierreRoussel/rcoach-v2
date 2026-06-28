import { describe, expect, it } from 'vitest'

import {
  applyDayValidation,
  computeActiveStreak,
  computeDisplayStreak,
  createRecoveryState,
  detectMissedDayState,
  isEligibleSameDayLog,
  isRecoveryExpired,
  reconcileStreakState,
  toValidatedDateSet,
} from '@/lib/nutrition/streak-gamification'
import { computeMonthOnTargetSummary, aggregateNutritionDays } from '@/lib/nutrition/streak'

describe('isEligibleSameDayLog', () => {
  it('accepts only same calendar day', () => {
    expect(isEligibleSameDayLog('2026-06-25', '2026-06-25')).toBe(true)
    expect(isEligibleSameDayLog('2026-06-24', '2026-06-25')).toBe(false)
    expect(isEligibleSameDayLog('2026-06-26', '2026-06-25')).toBe(false)
  })
})

describe('computeActiveStreak', () => {
  it('counts consecutive validated days ending today', () => {
    const dates = toValidatedDateSet(['2026-06-23', '2026-06-24', '2026-06-25'])
    expect(computeActiveStreak(dates, '2026-06-25')).toBe(3)
  })

  it('gracefully counts from yesterday when today is empty', () => {
    const dates = toValidatedDateSet(['2026-06-23', '2026-06-24'])
    expect(computeActiveStreak(dates, '2026-06-25')).toBe(2)
  })

  it('ignores retroactive gaps', () => {
    const dates = toValidatedDateSet(['2026-06-20', '2026-06-25'])
    expect(computeActiveStreak(dates, '2026-06-25')).toBe(1)
  })
})

describe('detectMissedDayState', () => {
  it('returns ok when today or yesterday is validated', () => {
    const dates = toValidatedDateSet(['2026-06-24'])
    expect(detectMissedDayState(dates, '2026-06-25').kind).toBe('ok')
  })

  it('returns recovery_eligible after exactly one missed day', () => {
    const dates = toValidatedDateSet(['2026-06-22', '2026-06-23'])
    const state = detectMissedDayState(dates, '2026-06-25')
    expect(state).toEqual({ kind: 'recovery_eligible', frozenStreak: 2 })
  })

  it('returns broken after two or more missed days', () => {
    const dates = toValidatedDateSet(['2026-06-22'])
    expect(detectMissedDayState(dates, '2026-06-25').kind).toBe('broken')
  })
})

describe('applyDayValidation', () => {
  it('does not re-validate an already validated day', () => {
    const dates = toValidatedDateSet(['2026-06-25'])
    const result = applyDayValidation(dates, null, '2026-06-25', {
      hadEntriesBefore: true,
    })
    expect(result.isNewValidation).toBe(false)
    expect(result.event.kind).toBe('none')
  })

  it('celebrates on first validation of the day', () => {
    const result = applyDayValidation(toValidatedDateSet([]), null, '2026-06-25', {
      hadEntriesBefore: false,
    })
    expect(result.event).toMatchObject({
      kind: 'celebration',
      streak: 1,
      firstLogToday: true,
    })
  })

  it('does not celebrate when entries already existed', () => {
    const result = applyDayValidation(toValidatedDateSet([]), null, '2026-06-25', {
      hadEntriesBefore: true,
    })
    expect(result.event).toMatchObject({
      kind: 'celebration',
      firstLogToday: false,
    })
  })

  it('advances recovery progress and completes with frozen + 2', () => {
    const recovery = createRecoveryState(5, '2026-06-24')
    const afterFirst = applyDayValidation(toValidatedDateSet([]), recovery, '2026-06-24', {
      hadEntriesBefore: false,
    })
    expect(afterFirst.event).toMatchObject({
      kind: 'recovery_progress',
      progress: 1,
      frozenStreak: 5,
    })

    const afterSecond = applyDayValidation(
      afterFirst.validatedDates,
      afterFirst.recovery,
      '2026-06-25',
      { hadEntriesBefore: false },
    )
    expect(afterSecond.event).toMatchObject({
      kind: 'recovery_complete',
      streak: 7,
    })
    expect(afterSecond.recovery).toBeNull()
  })
})

describe('computeDisplayStreak', () => {
  it('shows frozen streak during recovery', () => {
    const display = computeDisplayStreak(
      toValidatedDateSet([]),
      createRecoveryState(5, '2026-06-25'),
      '2026-06-25',
    )
    expect(display).toEqual({
      streak: 5,
      isFrozen: true,
      recoveryProgress: 0,
    })
  })
})

describe('isRecoveryExpired', () => {
  it('expires when first recovery day is missed', () => {
    const recovery = createRecoveryState(4, '2026-06-24')
    expect(isRecoveryExpired(recovery, toValidatedDateSet([]), '2026-06-26')).toBe(true)
  })
})

describe('reconcileStreakState', () => {
  it('opens recovery dialog when eligible', () => {
    const dates = toValidatedDateSet(['2026-06-22', '2026-06-23'])
    const result = reconcileStreakState(dates, null, '2026-06-25')
    expect(result.shouldOpenRecoveryDialog).toBe(true)
    expect(result.recovery?.frozenStreak).toBe(2)
  })
})

describe('computeMonthOnTargetSummary', () => {
  it('counts on_target days in the month', () => {
    const map = aggregateNutritionDays(
      [
        { logged_date: '2026-06-01', calories: 1000 },
        { logged_date: '2026-06-02', calories: 2500 },
        { logged_date: '2026-06-03', calories: 1800 },
      ],
      2000,
    )

    expect(computeMonthOnTargetSummary(map, 2026, 5)).toEqual({
      onTargetDays: 2,
      daysInMonth: 30,
    })
  })
})
