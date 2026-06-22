import { describe, expect, it } from 'vitest'

import {
  adjustReps,
  adjustWeightKg,
  buildIdleWorkoutSnapshot,
  buildWorkoutSnapshot,
  decodeWatchCommand,
  decodeWorkoutSnapshot,
  encodeWatchCommand,
  encodeWorkoutSnapshot,
  getNextSetNumber,
  getSuggestedSetValues,
} from '@/lib/wear/workout-sync-protocol'

describe('workout-sync-protocol', () => {
  it('builds snapshot from active workout state', () => {
    const snapshot = buildWorkoutSnapshot({
      title: 'Fullbody A',
      startedAt: '2026-06-10T16:00:00.000Z',
      defaultRestSeconds: 90,
      activeExerciseIndex: 1,
      isResting: true,
      restSecondsLeft: 45,
      exercises: [
        {
          exerciseId: 'ex-1',
          exerciseName: 'Squat',
          sets: [{ weightKg: 60, reps: 8 }],
        },
        {
          exerciseId: 'ex-2',
          exerciseName: 'Bench Press',
          sets: [],
        },
      ],
    })

    expect(snapshot.sessionId).toBe('2026-06-10T16:00:00.000Z')
    expect(snapshot.exercises[0]?.setsCount).toBe(1)
    expect(snapshot.exercises[1]?.suggestedSet).toEqual({
      weightKg: null,
      reps: null,
    })
  })

  it('round-trips snapshot encoding', () => {
    const snapshot = buildIdleWorkoutSnapshot()
    expect(decodeWorkoutSnapshot(encodeWorkoutSnapshot(snapshot))).toEqual(snapshot)
  })

  it('round-trips watch commands', () => {
    const command = {
      type: 'logSet' as const,
      exerciseIndex: 0,
      weightKg: 50,
      reps: 10,
      setType: 'normal' as const,
    }

    expect(decodeWatchCommand(encodeWatchCommand(command))).toEqual(command)
  })

  it('computes next set number and suggested defaults', () => {
    expect(getNextSetNumber(0)).toBe(1)
    expect(getSuggestedSetValues([])).toEqual({ weightKg: null, reps: null })
  })

  it('adjusts weight and reps for watch controls', () => {
    expect(adjustWeightKg(60, 2.5)).toBe(62.5)
    expect(adjustReps(8, 1)).toBe(9)
  })
})
