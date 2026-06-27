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

    expect(suggestion?.message).toContain('Dernière séance : 5 reps @ 7.5')
    expect(suggestion?.suggestedReps).toBe(6)
  })

  it('consolidates bodyweight reps when the last sets drop off', () => {
    const last = summarizePerformance('Pull day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: null, reps: 5 },
      { set_index: 1, set_type: 'normal', weight_kg: null, reps: 5 },
      { set_index: 2, set_type: 'normal', weight_kg: null, reps: 5 },
      { set_index: 3, set_type: 'normal', weight_kg: null, reps: 4 },
    ])

    const suggestion = suggestProgressiveOverload(
      { name: 'Traction', equipment: 'bodyweight' },
      last,
      { bodyWeightKg: 78 },
    )

    expect(suggestion).toMatchObject({
      suggestedReps: 5,
    })
    expect(suggestion?.message).toContain('5, 5, 5, 4 reps')
    expect(suggestion?.message).toContain('Viser 5 reps sur chaque série')
  })

  it('suggests only one extra rep when bodyweight sets are even', () => {
    const last = summarizePerformance('Pull day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: null, reps: 5 },
      { set_index: 1, set_type: 'normal', weight_kg: null, reps: 5 },
      { set_index: 2, set_type: 'normal', weight_kg: null, reps: 5 },
      { set_index: 3, set_type: 'normal', weight_kg: null, reps: 5 },
    ])

    const suggestion = suggestProgressiveOverload(
      { name: 'Traction', equipment: 'bodyweight' },
      last,
      { bodyWeightKg: 78 },
    )

    expect(suggestion).toMatchObject({
      suggestedReps: 6,
    })
    expect(suggestion?.message).not.toContain('à 7')
    expect(suggestion?.message).toContain('si toutes les séries restent propres')
  })

  it('does not suggest progression for the warm-up exercise', () => {
    const last = summarizePerformance('Session', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: null, reps: 10 },
    ])

    expect(
      suggestProgressiveOverload({ name: 'Échauffement', equipment: 'bodyweight' }, last),
    ).toBeNull()
    expect(
      suggestProgressiveOverload({ name: 'Warm Up', equipment: 'bodyweight' }, last),
    ).toBeNull()
  })

  it('suggests +10s for timed exercises', () => {
    const last = summarizePerformance(
      'Core',
      '2026-01-01T10:00:00Z',
      [{ set_index: 0, set_type: 'normal', weight_kg: null, reps: null, duration_seconds: 30 }],
      { name: 'Chaise', equipment: 'bodyweight', tracking_mode: 'timed' },
    )

    const suggestion = suggestProgressiveOverload(
      { name: 'Chaise', equipment: 'bodyweight', tracking_mode: 'timed' },
      last,
    )

    expect(suggestion).toMatchObject({
      kind: 'timed',
      suggestedDurationSeconds: 40,
    })
    expect(suggestion?.message).toContain('30s')
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
