import { describe, expect, it } from 'vitest'

import {
  buildExerciseCatalog,
  buildExerciseTimeline,
  compareBestLoadProgression,
  compareHighRpePerformance,
  resolvePeriodRange,
} from '@/lib/stats/exercise-progression'
import type { WorkoutSummary } from '@/lib/graphql/operations'

function workout(
  id: string,
  startedAt: string,
  exerciseId: string,
  sets: WorkoutSummary['workout_exercises'][number]['sets'],
): WorkoutSummary {
  return {
    id,
    title: `Workout ${id}`,
    started_at: startedAt,
    ended_at: startedAt,
    workout_exercises: [
      {
        id: `we-${id}`,
        exercise: {
          id: exerciseId,
          name: 'Bench Press',
          muscle_group: 'chest',
          equipment: 'barbell',
        },
        sets,
      },
    ],
  }
}

describe('resolvePeriodRange', () => {
  it('returns last 3 months for 3m', () => {
    const now = new Date('2026-06-15T12:00:00Z')
    const range = resolvePeriodRange('3m', now)

    expect(range.start?.getFullYear()).toBe(2026)
    expect(range.start?.getMonth()).toBe(2)
    expect(range.end.getMonth()).toBe(5)
  })
})

describe('buildExerciseCatalog', () => {
  it('sorts exercises by session count descending', () => {
    const workouts = [
      workout('1', '2026-06-01T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 50, reps: 5, set_type: 'normal', rpe: 8 },
      ]),
      workout('2', '2026-06-02T10:00:00Z', 'ex-b', [
        { set_index: 0, weight_kg: 40, reps: 8, set_type: 'normal', rpe: 7 },
      ]),
      workout('3', '2026-06-03T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 52, reps: 5, set_type: 'normal', rpe: 8.5 },
      ]),
    ]

    const catalog = buildExerciseCatalog(workouts)

    expect(catalog.map((entry) => entry.exerciseId)).toEqual(['ex-a', 'ex-b'])
    expect(catalog[0]?.sessionCount).toBe(2)
    expect(catalog[0]?.currentPerformance).toBe('5x52kg @8.5')
  })
})

describe('buildExerciseTimeline', () => {
  it('builds chronological points with estimated 1RM', () => {
    const workouts = [
      workout('1', '2026-05-01T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 50, reps: 5, set_type: 'normal', rpe: 8 },
      ]),
      workout('2', '2026-06-01T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 54, reps: 5, set_type: 'normal', rpe: 9 },
      ]),
    ]

    const timeline = buildExerciseTimeline(workouts, 'ex-a', 'all')

    expect(timeline).toHaveLength(2)
    expect(timeline[1]?.topSetLabel).toBe('5x54kg @9')
    expect(timeline[1]?.highRpeBest1Rm).toBeGreaterThan(
      timeline[0]?.highRpeBest1Rm ?? 0,
    )
  })

  it('shows reps for bodyweight sessions without load', () => {
    const workouts = [
      workout('1', '2026-06-01T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: null, reps: 12, set_type: 'normal', rpe: 9 },
        { set_index: 1, weight_kg: null, reps: 10, set_type: 'normal', rpe: 8 },
      ]),
    ]

    const timeline = buildExerciseTimeline(workouts, 'ex-a', 'all')

    expect(timeline[0]?.topSetLabel).toBe('12 reps @9')
    expect(timeline[0]?.best1Rm).toBeNull()
  })
})

describe('compareHighRpePerformance', () => {
  it('compares early vs late high-RPE sets within the selected period', () => {
    const workouts = [
      workout('1', '2026-03-15T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 26, reps: 10, set_type: 'normal', rpe: 8 },
      ]),
      workout('2', '2026-06-10T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 52, reps: 8, set_type: 'normal', rpe: 10 },
      ]),
    ]

    const comparison = compareHighRpePerformance(
      workouts,
      'ex-a',
      '3m',
      new Date('2026-06-15T12:00:00Z'),
    )

    expect(comparison.baselineOneRm).toBeCloseTo(34.7, 0)
    expect(comparison.currentOneRm).toBeCloseTo(65.9, 0)
    expect(comparison.deltaKg).toBeGreaterThan(0)
    expect(comparison.baselinePeriodLabel).toBe('Il y a 3 mois')
    expect(comparison.currentPeriodLabel).toBe("Aujourd'hui")
  })
})

describe('compareBestLoadProgression', () => {
  it('compares best load between early and late parts of the selected period', () => {
    const workouts = [
      workout('1', '2026-03-15T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 52, reps: 5, set_type: 'normal', rpe: 8 },
      ]),
      workout('2', '2026-06-10T10:00:00Z', 'ex-a', [
        { set_index: 0, weight_kg: 60, reps: 5, set_type: 'normal', rpe: 8.5 },
      ]),
    ]

    const comparison = compareBestLoadProgression(
      workouts,
      'ex-a',
      '3m',
      new Date('2026-06-15T12:00:00Z'),
    )

    expect(comparison.hasEnoughData).toBe(true)
    expect(comparison.baselineLabel).toBe('52 kg')
    expect(comparison.currentLabel).toBe('60 kg')
    expect(comparison.baselinePeriodLabel).toBe('Il y a 3 mois')
    expect(comparison.currentPeriodLabel).toBe("Aujourd'hui")
    expect(comparison.delta).toBe(8)
  })
})
