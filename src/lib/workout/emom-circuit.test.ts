import { describe, expect, it } from 'vitest'

import {
  buildEmomSlots,
  getEmomExercisesForSync,
  getSlotExerciseIndices,
  getSlotForMinute,
  isEmomComplete,
} from '@/lib/workout/emom-circuit'
import {
  createInitialEmomState,
  logEmomMinuteState,
  normalizeEmomState,
  skipToNextMinuteState,
  tickEmomState,
} from '@/lib/workout/emom-store'

function makeEmomExercise(
  id: string,
  name: string,
  options?: {
    emomGroupId?: number | null
    targetReps?: number | null
    targetWeightKg?: number | null
  },
) {
  return {
    exerciseId: id,
    exerciseName: name,
    emomGroupId: options?.emomGroupId ?? null,
    targetReps: options?.targetReps ?? null,
    targetWeightKg: options?.targetWeightKg ?? null,
    sets: [],
  }
}

describe('emom-circuit', () => {
  it('builds single-exercise slots in order', () => {
    const exercises = [
      makeEmomExercise('a', 'Squat'),
      makeEmomExercise('b', 'Push-up'),
      makeEmomExercise('c', 'Row'),
    ]

    expect(buildEmomSlots(exercises)).toEqual([
      { type: 'single', exerciseIndex: 0 },
      { type: 'single', exerciseIndex: 1 },
      { type: 'single', exerciseIndex: 2 },
    ])
  })

  it('groups exercises sharing emomGroupId into one slot', () => {
    const exercises = [
      makeEmomExercise('a', 'Squat', { emomGroupId: 1 }),
      makeEmomExercise('b', 'Push-up', { emomGroupId: 1 }),
      makeEmomExercise('c', 'Row'),
    ]

    expect(buildEmomSlots(exercises)).toEqual([
      { type: 'group', emomGroupId: 1, exerciseIndices: [0, 1] },
      { type: 'single', exerciseIndex: 2 },
    ])
  })

  it('rotates slots across minutes', () => {
    const slots = buildEmomSlots([
      makeEmomExercise('a', 'Squat'),
      makeEmomExercise('b', 'Push-up'),
    ])

    expect(getSlotExerciseIndices(getSlotForMinute(slots, 0))).toEqual([0])
    expect(getSlotExerciseIndices(getSlotForMinute(slots, 1))).toEqual([1])
    expect(getSlotExerciseIndices(getSlotForMinute(slots, 2))).toEqual([0])
  })

  it('detects EMOM completion', () => {
    expect(isEmomComplete(11, 12)).toBe(false)
    expect(isEmomComplete(12, 12)).toBe(true)
  })

  it('converts logged minutes into sync sets', () => {
    const exercises = [
      makeEmomExercise('a', 'Squat', { targetReps: 10 }),
      makeEmomExercise('b', 'Push-up', { targetReps: 15 }),
    ]
    const slots = buildEmomSlots(exercises)
    const synced = getEmomExercisesForSync(exercises, { 0: { loggedAt: '2026-01-01T00:00:00Z' } }, slots)

    expect(synced).toHaveLength(1)
    expect(synced[0]?.exerciseId).toBe('a')
    expect(synced[0]?.sets[0]?.reps).toBe(10)
  })

  it('includes target weight when syncing logged minutes', () => {
    const exercises = [makeEmomExercise('a', 'Squat', { targetReps: 5, targetWeightKg: 60 })]
    const slots = buildEmomSlots(exercises)
    const synced = getEmomExercisesForSync(
      exercises,
      { 0: { loggedAt: '2026-01-01T00:00:00Z' } },
      slots,
    )

    expect(synced[0]?.sets[0]?.weightKg).toBe(60)
    expect(synced[0]?.sets[0]?.reps).toBe(5)
  })
})

describe('emom-store', () => {
  it('starts with an optional countdown before minute 1', () => {
    const initial = createInitialEmomState(60, 3, { nowMs: 0, countdownSeconds: 3 })

    expect(initial.phase).toBe('countdown')
    expect(initial.countdownSecondsLeft).toBe(3)

    const afterTick = tickEmomState({ ...initial, emomEndsAt: 1_000 }, 1_000)
    expect(afterTick.state.phase).toBe('minute')
    expect(afterTick.state.currentMinuteIndex).toBe(0)
    expect(afterTick.events.map((event) => event.type)).toEqual([
      'countdown_complete',
      'minute_start',
    ])
  })

  it('skips countdown when configured to zero', () => {
    const initial = createInitialEmomState(60, 3, { countdownSeconds: 0 })
    expect(initial.phase).toBe('minute')
    expect(initial.secondsLeftInMinute).toBe(60)
  })

  it('ticks down and advances to the next minute', () => {
    const initial = createInitialEmomState(60, 3, { countdownSeconds: 0, nowMs: 1_000 })
    const midMinute = tickEmomState({ ...initial, emomEndsAt: 30_000 }, 1_000)
    expect(midMinute.state.secondsLeftInMinute).toBe(29)

    const nextMinute = tickEmomState(
      { ...initial, secondsLeftInMinute: 0, emomEndsAt: 1_000 },
      1_000,
    )
    expect(nextMinute.state.currentMinuteIndex).toBe(1)
    expect(nextMinute.state.secondsLeftInMinute).toBe(60)
  })

  it('completes when total minutes are reached', () => {
    const state = createInitialEmomState(60, 2, { countdownSeconds: 0, nowMs: 0 })
    const afterFirst = skipToNextMinuteState(state, 1_000)
    const afterSecond = skipToNextMinuteState(afterFirst.state, 2_000)

    expect(afterSecond.state.currentMinuteIndex).toBe(2)
    expect(isEmomComplete(afterSecond.state.currentMinuteIndex, afterSecond.state.totalMinutes)).toBe(true)
    expect(afterSecond.state.emomEndsAt).toBeNull()
  })

  it('stores optional minute logs', () => {
    const state = logEmomMinuteState(createInitialEmomState(60, 12, { countdownSeconds: 0 }), 0, '2026-01-01T00:00:00Z')
    expect(state.minuteLogs[0]?.loggedAt).toBe('2026-01-01T00:00:00Z')
  })

  it('normalizes legacy drafts without phase', () => {
    const legacy = normalizeEmomState({
      intervalSeconds: 60,
      totalMinutes: 12,
      startedAtMs: 0,
      currentMinuteIndex: 0,
      secondsLeftInMinute: 45,
      emomEndsAt: 45_000,
      minuteLogs: {},
    })

    expect(legacy.phase).toBe('minute')
    expect(legacy.countdownSecondsLeft).toBeNull()
  })
})
