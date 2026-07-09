import { describe, expect, it } from 'vitest'

import type { WorkoutSummary } from '@/lib/graphql/operations'
import {
  countWorkoutPersonalRecords,
  detectWorkoutPersonalRecords,
  draftToWorkoutSummary,
  estimateWorkoutCalories,
  formatWorkoutCalories,
} from '@/lib/stats/workout-metrics'

function buildWorkout(
  id: string,
  startedAt: string,
  exercises: Array<{
    exerciseId: string
    exerciseName: string
    sets: Array<{ weight: number; reps: number; setType?: string }>
  }>,
): WorkoutSummary {
  return {
    id,
    title: 'Test',
    started_at: startedAt,
    ended_at: startedAt,
    workout_exercises: exercises.map((exercise, index) => ({
      id: `we-${id}-${index}`,
      exercise: {
        id: exercise.exerciseId,
        name: exercise.exerciseName,
        muscle_group: null,
        equipment: null,
      },
      sets: exercise.sets.map((set, setIndex) => ({
        set_index: setIndex,
        weight_kg: set.weight,
        reps: set.reps,
        set_type: set.setType ?? 'normal',
        rpe: null,
      })),
    })),
  }
}

describe('detectWorkoutPersonalRecords', () => {
  it('returns all exercises as records when there is no history', () => {
    const workout = buildWorkout('w1', '2026-06-20T10:00:00.000Z', [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Squat',
        sets: [{ weight: 100, reps: 5 }],
      },
      {
        exerciseId: 'ex-2',
        exerciseName: 'Bench',
        sets: [{ weight: 80, reps: 8 }],
      },
    ])

    const records = detectWorkoutPersonalRecords(workout, [])

    expect(records).toHaveLength(2)
    expect(records[0]).toMatchObject({
      exerciseName: 'Squat',
      weightKg: 100,
      reps: 5,
      kinds: expect.arrayContaining(['volume', 'oneRm']),
    })
  })

  it('returns no records when performance does not beat history', () => {
    const historical = buildWorkout('w0', '2026-06-19T10:00:00.000Z', [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Squat',
        sets: [{ weight: 100, reps: 5 }],
      },
    ])
    const current = buildWorkout('w1', '2026-06-20T10:00:00.000Z', [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Squat',
        sets: [{ weight: 90, reps: 5 }],
      },
    ])

    expect(detectWorkoutPersonalRecords(current, [historical])).toEqual([])
    expect(countWorkoutPersonalRecords(current, [historical])).toBe(0)
  })

  it('detects a volume record without a 1RM record', () => {
    const historical = buildWorkout('w0', '2026-06-19T10:00:00.000Z', [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Curl',
        sets: [{ weight: 20, reps: 3 }],
      },
    ])
    const current = buildWorkout('w1', '2026-06-20T10:00:00.000Z', [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Curl',
        sets: [{ weight: 15, reps: 12 }],
      },
    ])

    const records = detectWorkoutPersonalRecords(current, [historical])

    expect(records).toHaveLength(1)
    expect(records[0]?.kinds).toEqual(['volume'])
  })

  it('keeps the best record per exercise for display', () => {
    const workout = buildWorkout('w1', '2026-06-20T10:00:00.000Z', [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Squat',
        sets: [
          { weight: 80, reps: 10 },
          { weight: 100, reps: 5 },
        ],
      },
    ])

    const records = detectWorkoutPersonalRecords(workout, [])

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ weightKg: 100, reps: 5 })
    expect(countWorkoutPersonalRecords(workout, [])).toBe(2)
  })

  it('ignores workout rows whose exercise relation was deleted', () => {
    const workout = buildWorkout('w1', '2026-06-20T10:00:00.000Z', [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Squat',
        sets: [{ weight: 100, reps: 5 }],
      },
    ])
    workout.workout_exercises[0]!.exercise = null

    expect(detectWorkoutPersonalRecords(workout, [])).toHaveLength(1)
    expect(detectWorkoutPersonalRecords(workout, [])[0]?.exerciseName).toBe(
      'Exercice supprimé',
    )
    expect(countWorkoutPersonalRecords(workout, [])).toBe(1)
  })
})

describe('draftToWorkoutSummary', () => {
  it('maps draft exercises to workout summary shape', () => {
    const summary = draftToWorkoutSummary(
      {
        title: 'Push',
        startedAt: '2026-06-20T10:00:00.000Z',
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Bench',
            sets: [
              {
                setIndex: 0,
                setType: 'normal',
                weightKg: 60,
                reps: 10,
                completedAt: '2026-06-20T10:30:00.000Z',
              },
            ],
          },
        ],
      },
      '2026-06-20T11:00:00.000Z',
    )

    expect(summary.title).toBe('Push')
    expect(summary.workout_exercises[0]?.sets[0]).toMatchObject({
      weight_kg: 60,
      reps: 10,
      set_type: 'normal',
    })
  })
})

describe('estimateWorkoutCalories', () => {
  it('estimates calories from duration and body weight', () => {
    const kcal = estimateWorkoutCalories({
      startedAt: '2026-06-20T10:00:00.000Z',
      endedAt: '2026-06-20T11:00:00.000Z',
      volumeKg: 3000,
      completedSets: 12,
      bodyWeightKg: 75,
    })

    expect(kcal).toBeGreaterThan(200)
    expect(kcal).toBeLessThan(500)
  })

  it('uses a default body weight when none is provided', () => {
    const withWeight = estimateWorkoutCalories({
      startedAt: '2026-06-20T10:00:00.000Z',
      endedAt: '2026-06-20T10:45:00.000Z',
      volumeKg: 1500,
      completedSets: 8,
      bodyWeightKg: 70,
    })
    const fallback = estimateWorkoutCalories({
      startedAt: '2026-06-20T10:00:00.000Z',
      endedAt: '2026-06-20T10:45:00.000Z',
      volumeKg: 1500,
      completedSets: 8,
    })

    expect(fallback).toBe(withWeight)
  })

  it('formats calories for display', () => {
    expect(formatWorkoutCalories(312)).toBe('312 kcal')
  })
})
