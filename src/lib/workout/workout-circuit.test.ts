import { describe, expect, it } from 'vitest'

import {
  buildCircuitSteps,
  findHighestCompletedStepIndex,
  findNextPendingStepIndex,
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
    expect(findNextPendingStepIndex(steps, exercises, 0)).toBeNull()
    expect(isWorkoutComplete(steps, exercises)).toBe(true)
  })

  it('tracks highest completed step for out-of-order progress', () => {
    const exercises = [
      {
        ...makeExercise('a', 'Squat', 3),
        sets: [
          { setIndex: 0, completedAt: null, weightKg: 50, reps: 5 },
          { setIndex: 1, completedAt: null, weightKg: 50, reps: 5 },
          { setIndex: 2, completedAt: '2026-01-01T00:00:00.000Z', weightKg: 50, reps: 5 },
        ],
      },
    ]
    const steps = buildCircuitSteps(exercises)

    expect(findHighestCompletedStepIndex(steps, exercises)).toBe(2)
    expect(findNextPendingStepIndex(steps, exercises, 2)).toBeNull()
  })
})
