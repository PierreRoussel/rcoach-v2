import { describe, expect, it } from 'vitest'

import {
  applyOverloadToWorkingSets,
  isWorkingSet,
  suggestProgressiveOverload,
  summarizePerformance,
} from '@/lib/workout/progressive-overload'

const benchPress = { name: 'Bench Press', equipment: 'barbell' }

describe('suggestProgressiveOverload', () => {
  it('suggests +1 rep when weighted reps are below 8', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 60, reps: 6 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last)

    expect(suggestion).toMatchObject({
      suggestedWeightKg: 60,
      suggestedReps: 7,
    })
  })

  it('suggests heavier weight when weighted reps are at least 8', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 60, reps: 8 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last)

    expect(suggestion).toMatchObject({
      suggestedWeightKg: 62.5,
      suggestedReps: 7,
    })
  })

  it('includes RPE in the last session reference', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: null, reps: 5, rpe: 7.5 },
    ])

    const suggestion = suggestProgressiveOverload(
      { name: 'Pull up', equipment: 'bodyweight' },
      last,
    )

    expect(suggestion?.message).toContain('Derniere seance : 5 reps @ 7.5')
  })
})

describe('isWorkingSet', () => {
  it('excludes warmup sets', () => {
    expect(isWorkingSet({ setType: 'warmup' })).toBe(false)
    expect(isWorkingSet({ setType: 'normal' })).toBe(true)
  })
})

describe('applyOverloadToWorkingSets', () => {
  it('updates all working sets and skips warmup', () => {
    const sets = [
      { setIndex: 0, setType: 'warmup' as const, weightKg: 40, reps: 10 },
      { setIndex: 1, setType: 'normal' as const, weightKg: 60, reps: 8 },
      { setIndex: 2, setType: 'normal' as const, weightKg: 60, reps: 8 },
    ]

    const updated = applyOverloadToWorkingSets(sets, {
      kind: 'weighted',
      message: 'test',
      suggestedWeightKg: 62.5,
      suggestedReps: 7,
      suggestedDurationSeconds: null,
      suggestedDistanceKm: null,
    })

    expect(updated[0]).toEqual(sets[0])
    expect(updated[1]).toMatchObject({ weightKg: 62.5, reps: 7 })
    expect(updated[2]).toMatchObject({ weightKg: 62.5, reps: 7 })
  })

  it('does not overwrite fields when suggestion values are null', () => {
    const sets = [{ setIndex: 0, setType: 'normal' as const, weightKg: 20, reps: 12 }]

    const updated = applyOverloadToWorkingSets(sets, {
      kind: 'band',
      message: 'test',
      suggestedWeightKg: null,
      suggestedReps: 13,
      suggestedDurationSeconds: null,
      suggestedDistanceKm: null,
    })

    expect(updated[0]).toMatchObject({ weightKg: 20, reps: 13 })
  })
})
