import { describe, expect, it } from 'vitest'

import {
  formatActiveWorkoutElapsed,
  getWorkoutEncouragementMessage,
} from '@/lib/workout/workout-encouragement'
import type { CircuitExercise } from '@/lib/workout/workout-circuit'

function makeExercise(
  name: string,
  setCount: number,
  completedCount = 0,
): CircuitExercise {
  return {
    exerciseId: name.toLowerCase(),
    exerciseName: name,
    sets: Array.from({ length: setCount }, (_, setIndex) => ({
      setIndex,
      completedAt:
        setIndex < completedCount ? '2026-01-01T10:00:00.000Z' : null,
    })),
  }
}

describe('formatActiveWorkoutElapsed', () => {
  it('formats sub-hour elapsed time as mm:ss', () => {
    const startedAt = '2026-01-01T10:00:00.000Z'
    const now = new Date('2026-01-01T10:12:34.000Z')

    expect(formatActiveWorkoutElapsed(startedAt, now)).toBe('12:34')
  })

  it('formats hour-long elapsed time as h:mm', () => {
    const startedAt = '2026-01-01T10:00:00.000Z'
    const now = new Date('2026-01-01T11:05:00.000Z')

    expect(formatActiveWorkoutElapsed(startedAt, now)).toBe('1h05')
  })
})

describe('getWorkoutEncouragementMessage', () => {
  it('prompts to add exercises when the workout is empty', () => {
    expect(getWorkoutEncouragementMessage([], null)).toBe(
      'Ajoutez des exercices pour avancer',
    )
  })

  it('celebrates when every set is completed', () => {
    const exercises = [makeExercise('Bench Press', 3, 3)]

    expect(getWorkoutEncouragementMessage(exercises, null)).toBe(
      'Toutes les séries sont faites — terminez la séance !',
    )
  })

  it('highlights the last set on the current exercise', () => {
    const exercises = [makeExercise('Bench Press', 3, 2)]

    expect(getWorkoutEncouragementMessage(exercises, null)).toBe(
      "Plus qu'1 série de Bench Press !",
    )
  })

  it('signals the final exercise when several sets remain', () => {
    const exercises = [
      makeExercise('Squat', 3, 3),
      makeExercise('Bench Press', 4, 0),
    ]

    expect(getWorkoutEncouragementMessage(exercises, null)).toBe(
      'Un dernier exercice avant la fin !',
    )
  })

  it('counts remaining sets on the current exercise', () => {
    const exercises = [makeExercise('Deadlift', 4, 2)]

    expect(getWorkoutEncouragementMessage(exercises, null)).toBe(
      'Plus que 2 séries de Deadlift !',
    )
  })
})
