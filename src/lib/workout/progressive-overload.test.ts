import { describe, expect, it } from 'vitest'

import {
  applyOverloadToWorkingSets,
  isWorkingSet,
  lastWorkingSet,
  suggestProgressiveOverload,
  summarizePerformance,
} from '@/lib/workout/progressive-overload'

const benchPress = {
  name: 'Bench Press',
  equipment: 'barbell',
  muscle_group: 'chest',
}

const bicepsCurl = {
  name: 'Biceps Curl',
  equipment: 'dumbbell',
  muscle_group: 'biceps',
}

describe('lastWorkingSet', () => {
  it('uses the last working set by set_index, not the highest volume', () => {
    const sets = [
      { set_index: 0, set_type: 'warmup', weight_kg: 40, reps: 10 },
      { set_index: 1, set_type: 'normal', weight_kg: 60, reps: 10 },
      { set_index: 2, set_type: 'normal', weight_kg: 60, reps: 8 },
      { set_index: 3, set_type: 'normal', weight_kg: 60, reps: 6, rpe: 9 },
    ]

    expect(lastWorkingSet(sets)).toMatchObject({
      set_index: 3,
      weight_kg: 60,
      reps: 6,
      rpe: 9,
    })
  })
})

describe('suggestProgressiveOverload', () => {
  it('suggests +1 rep when compound reps are below 8', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 60, reps: 6, rpe: 7 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last)

    expect(suggestion).toMatchObject({
      suggestedWeightKg: 60,
      suggestedReps: 7,
      actionable: true,
    })
    expect(suggestion?.message).toContain('+1 rep à 60 kg')
  })

  it('suggests heavier weight when compound reps reach the rep ceiling', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 60, reps: 8, rpe: 7 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last)

    expect(suggestion).toMatchObject({
      suggestedWeightKg: 62.5,
      suggestedReps: 7,
      actionable: true,
    })
    expect(suggestion?.message).toContain('Plafond atteint')
  })

  it('uses +1 kg for isolation exercises at rep ceiling', () => {
    const last = summarizePerformance('Arms', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 12, reps: 12, rpe: 7 },
    ])

    const suggestion = suggestProgressiveOverload(bicepsCurl, last)

    expect(suggestion).toMatchObject({
      suggestedWeightKg: 13,
      suggestedReps: 11,
      actionable: true,
    })
  })

  it('suggests +1 rep for isolation below rep ceiling', () => {
    const last = summarizePerformance('Arms', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 12, reps: 10, rpe: 7 },
    ])

    const suggestion = suggestProgressiveOverload(bicepsCurl, last)

    expect(suggestion).toMatchObject({
      suggestedWeightKg: 12,
      suggestedReps: 11,
      actionable: true,
    })
  })

  it('blocks progression when last set RPE is 9 or higher', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 60, reps: 8, rpe: 9 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last)

    expect(suggestion).toMatchObject({
      actionable: false,
      adaptedLoad: true,
      message: 'Charge adaptée',
    })
    expect(suggestion?.suggestedWeightKg).toBeNull()
  })

  it('allows progression at RPE 8', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 60, reps: 6, rpe: 8 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last)

    expect(suggestion?.actionable).toBe(true)
  })

  it('asks for RPE when enabled but missing on last set', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: 60, reps: 6 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last, {
      rpeEnabled: true,
    })

    expect(suggestion).toMatchObject({
      actionable: false,
    })
    expect(suggestion?.message).toContain('Indiquez un RPE')
  })

  it('includes RPE in the last session reference', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'normal', weight_kg: null, reps: 5, rpe: 7.5 },
    ])

    const suggestion = suggestProgressiveOverload(
      { name: 'Pull up', equipment: 'bodyweight', muscle_group: 'back' },
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
      { name: 'Traction', equipment: 'bodyweight', muscle_group: 'back' },
      last,
      { bodyWeightKg: 78 },
    )

    expect(suggestion).toMatchObject({
      suggestedReps: 5,
      actionable: true,
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
      { name: 'Traction', equipment: 'bodyweight', muscle_group: 'back' },
      last,
      { bodyWeightKg: 78 },
    )

    expect(suggestion).toMatchObject({
      suggestedReps: 6,
      actionable: true,
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

  it('ignores warmup sets when picking the reference set', () => {
    const last = summarizePerformance('Push day', '2026-01-01T10:00:00Z', [
      { set_index: 0, set_type: 'warmup', weight_kg: 20, reps: 15 },
      { set_index: 1, set_type: 'normal', weight_kg: 60, reps: 6, rpe: 7 },
    ])

    const suggestion = suggestProgressiveOverload(benchPress, last)

    expect(suggestion).toMatchObject({
      suggestedWeightKg: 60,
      suggestedReps: 7,
    })
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
      actionable: true,
    })
    expect(suggestion?.message).toContain('30s')
  })
})

describe('isWorkingSet', () => {
  it('excludes warmup sets', () => {
    expect(isWorkingSet({ setType: 'warmup' })).toBe(false)
    expect(isWorkingSet({ setType: 'normal' })).toBe(true)
    expect(isWorkingSet({ set_type: 'warmup' })).toBe(false)
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
      actionable: true,
    })

    expect(updated[0]).toEqual(sets[0])
    expect(updated[1]).toMatchObject({ weightKg: 62.5, reps: 7 })
    expect(updated[2]).toMatchObject({ weightKg: 62.5, reps: 7 })
  })

  it('does not modify sets when suggestion is not actionable', () => {
    const sets = [
      { setIndex: 0, setType: 'warmup' as const, weightKg: 40, reps: 10 },
      { setIndex: 1, setType: 'normal' as const, weightKg: 60, reps: 8 },
    ]

    const updated = applyOverloadToWorkingSets(sets, {
      kind: 'weighted',
      message: 'consolidate',
      suggestedWeightKg: 65,
      suggestedReps: 6,
      suggestedDurationSeconds: null,
      suggestedDistanceKm: null,
      actionable: false,
    })

    expect(updated).toEqual(sets)
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
      actionable: true,
    })

    expect(updated[0]).toMatchObject({ weightKg: 20, reps: 13 })
  })
})
