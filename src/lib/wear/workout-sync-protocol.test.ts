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
  getSuggestedSetValues,
} from '@/lib/wear/workout-sync-protocol'

describe('workout-sync-protocol', () => {
  it('builds snapshot from active workout state', () => {
    const snapshot = buildWorkoutSnapshot(
      {
        title: 'Fullbody A',
        startedAt: '2026-06-10T16:00:00.000Z',
        defaultRestSeconds: 90,
        activeStepIndex: 1,
        isResting: true,
        restSecondsLeft: 45,
        restTargetSeconds: 60,
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'Squat',
            sets: [
              {
                setIndex: 0,
                weightKg: 60,
                reps: 8,
                completedAt: '2026-06-10T16:01:00.000Z',
              },
              { setIndex: 1, weightKg: 62.5, reps: 8, completedAt: null },
            ],
          },
        ],
      },
      {
        steps: [
          { exerciseIndex: 0, setIndex: 0 },
          { exerciseIndex: 0, setIndex: 1 },
        ],
        currentStep: { exerciseIndex: 0, setIndex: 1 },
        nextStepLabel: null,
      },
    )

    expect(snapshot.sessionId).toBe('2026-06-10T16:00:00.000Z')
    expect(snapshot.currentStep?.setNumber).toBe(2)
    expect(snapshot.exercises[0]?.completedSetsCount).toBe(1)
    expect(snapshot.restTargetSeconds).toBe(60)
  })

  it('round-trips snapshot encoding', () => {
    const snapshot = buildIdleWorkoutSnapshot()
    expect(decodeWorkoutSnapshot(encodeWorkoutSnapshot(snapshot))).toEqual(snapshot)
  })

  it('round-trips watch commands', () => {
    const command = {
      type: 'completeStep' as const,
      exerciseIndex: 0,
      setIndex: 1,
      weightKg: 50,
      reps: 10,
      setType: 'normal' as const,
    }

    expect(decodeWatchCommand(encodeWatchCommand(command))).toEqual(command)
  })

  it('reads planned set values for suggestions', () => {
    expect(
      getSuggestedSetValues(
        [
          { weightKg: 60, reps: 8, completedAt: 'x' },
          { weightKg: 62.5, reps: 8, completedAt: null },
        ],
        1,
      ),
    ).toEqual({ weightKg: 62.5, reps: 8, rpe: null })
  })

  it('adjusts weight and reps for watch controls', () => {
    expect(adjustWeightKg(60, 2.5)).toBe(62.5)
    expect(adjustReps(8, 1)).toBe(9)
  })
})
