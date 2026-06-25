import { describe, expect, it } from 'vitest'

import {
  buildCircuitSteps,
  findLastCompletedStep,
  findNextPendingStepIndex,
  findNextStepIndexAfter,
  getStepRestSeconds,
  isIntraSupersetTransition,
  isWorkoutComplete,
  type CircuitExercise,
} from '@/lib/workout/workout-circuit'

function makeExercise(
  id: string,
  name: string,
  setCount: number,
  options?: {
    supersetId?: number
    defaultRestSeconds?: number
    restSeconds?: number
    completed?: boolean
  },
): CircuitExercise {
  return {
    exerciseId: id,
    exerciseName: name,
    supersetId: options?.supersetId ?? null,
    defaultRestSeconds: options?.defaultRestSeconds ?? 90,
    sets: Array.from({ length: setCount }, (_, setIndex) => ({
      setIndex,
      weightKg: 50,
      reps: 10,
      restSeconds: options?.restSeconds ?? 90,
      completedAt: options?.completed ? new Date().toISOString() : null,
    })),
  }
}

describe('workout-circuit', () => {
  it('orders single exercise sets sequentially', () => {
    const exercises = [makeExercise('a', 'Squat', 3)]
    const steps = buildCircuitSteps(exercises)

    expect(steps).toEqual([
      { exerciseIndex: 0, setIndex: 0 },
      { exerciseIndex: 0, setIndex: 1 },
      { exerciseIndex: 0, setIndex: 2 },
    ])
  })

  it('alternates superset exercises by round', () => {
    const exercises = [
      makeExercise('a', 'Bench', 2, { supersetId: 1 }),
      makeExercise('b', 'Row', 2, { supersetId: 1 }),
    ]
    const steps = buildCircuitSteps(exercises)

    expect(steps).toEqual([
      { exerciseIndex: 0, setIndex: 0 },
      { exerciseIndex: 1, setIndex: 0 },
      { exerciseIndex: 0, setIndex: 1 },
      { exerciseIndex: 1, setIndex: 1 },
    ])
  })

  it('detects intra-superset transitions without rest', () => {
    const exercises = [
      makeExercise('a', 'Bench', 2, { supersetId: 1 }),
      makeExercise('b', 'Row', 2, { supersetId: 1 }),
    ]

    expect(
      isIntraSupersetTransition(
        exercises,
        { exerciseIndex: 0, setIndex: 0 },
        { exerciseIndex: 1, setIndex: 0 },
      ),
    ).toBe(true)

    expect(
      getStepRestSeconds(
        exercises,
        { exerciseIndex: 0, setIndex: 0 },
        { exerciseIndex: 1, setIndex: 0 },
        90,
      ),
    ).toBe(0)
  })

  it('applies rest after superset round and isolated sets', () => {
    const exercises = [
      makeExercise('a', 'Bench', 2, { supersetId: 1, restSeconds: 60 }),
      makeExercise('b', 'Row', 2, { supersetId: 1, restSeconds: 60 }),
    ]

    expect(
      getStepRestSeconds(
        exercises,
        { exerciseIndex: 1, setIndex: 0 },
        { exerciseIndex: 0, setIndex: 1 },
        90,
      ),
    ).toBe(60)

    const single = [makeExercise('a', 'Squat', 2, { restSeconds: 120 })]
    expect(
      getStepRestSeconds(
        single,
        { exerciseIndex: 0, setIndex: 0 },
        { exerciseIndex: 0, setIndex: 1 },
        90,
      ),
    ).toBe(120)
  })

  it('finds next pending step and completion state', () => {
    const exercises = [
      {
        ...makeExercise('a', 'Squat', 2),
        sets: [
          { setIndex: 0, completedAt: '2026-01-01T00:00:00.000Z', weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt: null, weightKg: 50, reps: 5 },
        ],
      },
    ]
    const steps = buildCircuitSteps(exercises)

    expect(findNextPendingStepIndex(steps, exercises, 0)).toBe(1)
    expect(isWorkoutComplete(steps, exercises)).toBe(false)

    exercises[0]!.sets[1]!.completedAt = '2026-01-01T00:00:01.000Z'
    expect(
      findNextStepIndexAfter(steps, exercises, { exerciseIndex: 0, setIndex: 1 }),
    ).toBeNull()
    expect(
      isWorkoutComplete(steps, exercises, { exerciseIndex: 0, setIndex: 1 }),
    ).toBe(true)
  })

  it('finds the most recently completed set', () => {
    const exercises = [
      {
        ...makeExercise('a', 'Squat', 2),
        sets: [
          { setIndex: 0, completedAt: '2026-01-01T00:00:00.000Z', weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt: '2026-01-01T00:00:02.000Z', weightKg: 50, reps: 5 },
        ],
      },
      {
        ...makeExercise('b', 'Bench', 2),
        sets: [
          { setIndex: 0, completedAt: '2026-01-01T00:00:01.000Z', weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt: null, weightKg: 50, reps: 5 },
        ],
      },
    ]

    expect(findLastCompletedStep(exercises)).toEqual({ exerciseIndex: 0, setIndex: 1 })
  })

  it('continues from the last validated set instead of earlier pending sets', () => {
    const completedAt = '2026-01-01T00:00:00.000Z'
    const exercises = [
      makeExercise('a', 'Squat', 2),
      makeExercise('b', 'Bench', 2),
      {
        ...makeExercise('c', 'Row', 4),
        sets: [
          { setIndex: 0, completedAt, weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt, weightKg: 50, reps: 5 },
          { setIndex: 2, completedAt, weightKg: 50, reps: 5 },
          { setIndex: 3, completedAt: null, weightKg: 50, reps: 5 },
        ],
      },
      {
        ...makeExercise('d', 'Curl', 3),
        sets: [
          { setIndex: 0, completedAt, weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt: null, weightKg: 50, reps: 5 },
          { setIndex: 2, completedAt: null, weightKg: 50, reps: 5 },
        ],
      },
    ]
    const steps = buildCircuitSteps(exercises)
    const lastCompleted = { exerciseIndex: 3, setIndex: 0 }

    expect(findNextStepIndexAfter(steps, exercises, lastCompleted)).toBe(9)
    expect(steps[9]).toEqual({ exerciseIndex: 3, setIndex: 1 })
  })

  it('continues superset alternation after completing a set', () => {
    const exercises = [
      {
        ...makeExercise('a', 'Bench', 2, { supersetId: 1 }),
        sets: [
          { setIndex: 0, completedAt: '2026-01-01T00:00:00.000Z', weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt: null, weightKg: 50, reps: 5 },
        ],
      },
      makeExercise('b', 'Row', 2, { supersetId: 1 }),
    ]
    const steps = buildCircuitSteps(exercises)

    expect(
      findNextStepIndexAfter(steps, exercises, { exerciseIndex: 0, setIndex: 0 }),
    ).toBe(1)
    expect(steps[1]).toEqual({ exerciseIndex: 1, setIndex: 0 })
  })

  it('returns skipped sets once the forward path from the last validation is exhausted', () => {
    const completedAt = '2026-01-01T00:00:00.000Z'
    const exercises = [
      {
        ...makeExercise('a', 'Squat', 2),
        sets: [
          { setIndex: 0, completedAt, weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt, weightKg: 50, reps: 5 },
        ],
      },
      {
        ...makeExercise('b', 'Bench', 2),
        sets: [
          { setIndex: 0, completedAt: null, weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt: null, weightKg: 50, reps: 5 },
        ],
      },
      {
        ...makeExercise('c', 'Row', 2),
        sets: [
          { setIndex: 0, completedAt, weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt, weightKg: 50, reps: 5 },
        ],
      },
      {
        ...makeExercise('d', 'Curl', 2),
        sets: [
          { setIndex: 0, completedAt, weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt, weightKg: 50, reps: 5 },
        ],
      },
    ]
    const steps = buildCircuitSteps(exercises)
    const lastCompleted = { exerciseIndex: 3, setIndex: 1 }

    expect(findNextStepIndexAfter(steps, exercises, lastCompleted)).toBe(2)
    expect(steps[2]).toEqual({ exerciseIndex: 1, setIndex: 0 })
    expect(isWorkoutComplete(steps, exercises, lastCompleted)).toBe(false)
  })

  it('alternates three-exercise supersets by round', () => {
    const exercises = [
      makeExercise('a', 'Bench', 2, { supersetId: 1 }),
      makeExercise('b', 'Row', 2, { supersetId: 1 }),
      makeExercise('c', 'Curl', 2, { supersetId: 1 }),
    ]
    const steps = buildCircuitSteps(exercises)

    expect(steps).toEqual([
      { exerciseIndex: 0, setIndex: 0 },
      { exerciseIndex: 1, setIndex: 0 },
      { exerciseIndex: 2, setIndex: 0 },
      { exerciseIndex: 0, setIndex: 1 },
      { exerciseIndex: 1, setIndex: 1 },
      { exerciseIndex: 2, setIndex: 1 },
    ])
  })

  it('applies zero rest between three-exercise superset transitions in a round', () => {
    const exercises = [
      makeExercise('a', 'Bench', 2, { supersetId: 1, restSeconds: 60 }),
      makeExercise('b', 'Row', 2, { supersetId: 1, restSeconds: 60 }),
      makeExercise('c', 'Curl', 2, { supersetId: 1, restSeconds: 60 }),
    ]

    expect(
      getStepRestSeconds(
        exercises,
        { exerciseIndex: 0, setIndex: 0 },
        { exerciseIndex: 1, setIndex: 0 },
        90,
      ),
    ).toBe(0)

    expect(
      getStepRestSeconds(
        exercises,
        { exerciseIndex: 1, setIndex: 0 },
        { exerciseIndex: 2, setIndex: 0 },
        90,
      ),
    ).toBe(0)

    expect(
      getStepRestSeconds(
        exercises,
        { exerciseIndex: 2, setIndex: 0 },
        { exerciseIndex: 0, setIndex: 1 },
        90,
      ),
    ).toBe(60)
  })

  it('handles two supersets in the same workout', () => {
    const exercises = [
      makeExercise('a', 'Bench', 2, { supersetId: 1 }),
      makeExercise('b', 'Row', 2, { supersetId: 1 }),
      makeExercise('c', 'Squat', 2),
      makeExercise('d', 'Curl', 2, { supersetId: 2 }),
      makeExercise('e', 'Dips', 2, { supersetId: 2 }),
    ]
    const steps = buildCircuitSteps(exercises)

    expect(steps).toEqual([
      { exerciseIndex: 0, setIndex: 0 },
      { exerciseIndex: 1, setIndex: 0 },
      { exerciseIndex: 0, setIndex: 1 },
      { exerciseIndex: 1, setIndex: 1 },
      { exerciseIndex: 2, setIndex: 0 },
      { exerciseIndex: 2, setIndex: 1 },
      { exerciseIndex: 3, setIndex: 0 },
      { exerciseIndex: 4, setIndex: 0 },
      { exerciseIndex: 3, setIndex: 1 },
      { exerciseIndex: 4, setIndex: 1 },
    ])
  })
})
