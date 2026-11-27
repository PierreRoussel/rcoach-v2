import { describe, expect, it } from 'vitest'

import {
  getExerciseTrackingKind,
  isHoldCapableExercise,
} from '@/lib/workout/exercise-tracking'

describe('getExerciseTrackingKind', () => {
  it('uses explicit tracking_mode when not auto', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Bench Press',
        equipment: 'barbell',
        tracking_mode: 'timed',
      }),
    ).toBe('timed')
  })

  it('uses explicit loaded_timed', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Custom',
        equipment: 'dumbbell',
        tracking_mode: 'loaded_timed',
      }),
    ).toBe('loaded_timed')
  })

  it('falls back to heuristics when tracking_mode is auto', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Chaise murale',
        equipment: 'bodyweight',
        tracking_mode: 'auto',
      }),
    ).toBe('timed')
  })

  it('classifies farmer carry as loaded_timed', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Farmer carry',
        equipment: 'dumbbell',
        tracking_mode: 'auto',
      }),
    ).toBe('loaded_timed')
  })

  it('classifies farmer hold as loaded_timed (carry before hold)', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Farmer hold',
        equipment: 'dumbbell',
        tracking_mode: 'auto',
      }),
    ).toBe('loaded_timed')
  })

  it('keeps plank as timed', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Planche',
        equipment: 'bodyweight',
        tracking_mode: 'auto',
      }),
    ).toBe('timed')
  })

  it('classifies weighted exercises by default', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Bench Press',
        equipment: 'barbell',
        tracking_mode: 'auto',
      }),
    ).toBe('weighted')
  })
})

describe('isHoldCapableExercise', () => {
  it('is true for timed and loaded_timed', () => {
    expect(
      isHoldCapableExercise({ name: 'Plank', tracking_mode: 'timed' }),
    ).toBe(true)
    expect(
      isHoldCapableExercise({ name: 'Farmer', tracking_mode: 'loaded_timed' }),
    ).toBe(true)
    expect(
      isHoldCapableExercise({ name: 'Squat', tracking_mode: 'weighted' }),
    ).toBe(false)
  })
})
