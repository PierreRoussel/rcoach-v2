import { describe, expect, it } from 'vitest'

import type { WorkoutSummary } from '@/lib/graphql/operations'
import { workoutToTemplateExercises } from '@/lib/workout/workout-to-template'

function makeWorkout(
  overrides?: Partial<WorkoutSummary>,
): WorkoutSummary {
  return {
    id: 'workout-1',
    title: 'Push',
    started_at: '2026-06-10T16:00:00.000Z',
    ended_at: '2026-06-10T17:00:00.000Z',
    workout_exercises: [
      {
        id: 'we-1',
        exercise: {
          id: 'ex-1',
          name: 'Bench Press',
          muscle_group: 'Chest',
          equipment: 'Barbell',
        },
        sets: [
          {
            set_index: 2,
            weight_kg: 10000,
            reps: 8.4,
            set_type: 'normal',
            rpe: null,
          },
          {
            set_index: 0,
            weight_kg: '80' as unknown as number,
            reps: '10' as unknown as number,
            set_type: 'normal',
            rpe: null,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('workoutToTemplateExercises', () => {
  it('normalizes set order and numeric values for template insert', () => {
    const exercises = workoutToTemplateExercises(makeWorkout(), 90)

    expect(exercises).toHaveLength(1)
    expect(exercises[0]?.sets).toEqual([
      {
        setIndex: 0,
        weightKg: 80,
        reps: 10,
        restSeconds: 90,
        usesGlobalRest: true,
      },
      {
        setIndex: 1,
        weightKg: 9999.99,
        reps: 8,
        restSeconds: 90,
        usesGlobalRest: true,
      },
    ])
  })

  it('creates a placeholder set when a workout exercise has no sets', () => {
    const rebuilt = workoutToTemplateExercises(
      {
        ...makeWorkout(),
        workout_exercises: [
          {
            ...makeWorkout().workout_exercises[0]!,
            sets: [],
          },
        ],
      },
      90,
    )

    expect(rebuilt[0]?.sets).toEqual([
      {
        setIndex: 0,
        weightKg: null,
        reps: null,
        restSeconds: 90,
        usesGlobalRest: true,
      },
    ])
  })
})
