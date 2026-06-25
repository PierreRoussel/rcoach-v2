import { describe, expect, it } from 'vitest'

import { getExerciseTrackingKind } from '@/lib/workout/exercise-tracking'

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

  it('falls back to heuristics when tracking_mode is auto', () => {
    expect(
      getExerciseTrackingKind({
        name: 'Chaise murale',
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
