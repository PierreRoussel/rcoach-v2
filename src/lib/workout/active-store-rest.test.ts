import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/dexie', () => ({
  db: {
    activeDraft: {
      get: vi.fn(async () => undefined),
      put: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
    },
  },
}))

vi.mock('@/lib/workout/rest-timer-audio', () => ({
  playRestCompleteBeep: vi.fn(),
  warmUpRestTimerAudio: vi.fn(),
}))

vi.mock('@/lib/workout/timer-haptics', () => ({
  notifyRestComplete: vi.fn(),
}))

vi.mock('@/lib/workout/emom-timer-feedback', () => ({
  handleEmomTickEvents: vi.fn(),
}))

import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { notifyRestComplete } from '@/lib/workout/timer-haptics'
import { playRestCompleteBeep } from '@/lib/workout/rest-timer-audio'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'

function twoSetExercise(restSeconds: number): ActiveExerciseEntry {
  return {
    exerciseId: 'ex-1',
    exerciseName: 'Squat',
    exerciseNameFr: null,
    muscleGroup: null,
    equipment: null,
    trackingMode: 'weighted',
    supersetId: null,
    emomGroupId: null,
    targetReps: 5,
    targetWeightKg: 60,
    defaultRestSeconds: restSeconds,
    sets: [
      {
        setIndex: 0,
        weightKg: 60,
        reps: 5,
        rpe: null,
        durationSeconds: null,
        setType: 'normal',
        completedAt: null,
        restSeconds,
      },
      {
        setIndex: 1,
        weightKg: 60,
        reps: 5,
        rpe: null,
        durationSeconds: null,
        setType: 'normal',
        completedAt: null,
        restSeconds,
      },
    ],
  }
}

describe('active-store rest auto-start', () => {
  beforeEach(() => {
    useActiveWorkoutStore.setState({
      title: '',
      startedAt: null,
      sessionMode: 'circuit',
      emom: null,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      sourceTemplateExerciseLineup: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      restEndsAt: null,
      isResting: false,
      isHolding: false,
      holdSecondsLeft: 0,
      holdTargetSeconds: 0,
      holdEndsAt: null,
      holdingStep: null,
    })
    vi.mocked(notifyRestComplete).mockClear()
    vi.mocked(playRestCompleteBeep).mockClear()
  })

  it('completeStep starts rest when restSeconds > 0', async () => {
    await useActiveWorkoutStore
      .getState()
      .startWorkoutFromTemplate('Test', [twoSetExercise(90)], 90)

    await useActiveWorkoutStore.getState().completeStep(0, 0, {
      weightKg: 60,
      reps: 5,
    })

    const state = useActiveWorkoutStore.getState()
    expect(state.isResting).toBe(true)
    expect(state.restTargetSeconds).toBe(90)
    expect(state.restEndsAt).toBeTypeOf('number')
  })

  it('completeStep skips rest when restSeconds is 0', async () => {
    await useActiveWorkoutStore
      .getState()
      .startWorkoutFromTemplate('Test', [twoSetExercise(0)], 0)

    await useActiveWorkoutStore.getState().completeStep(0, 0, {
      weightKg: 60,
      reps: 5,
    })

    const state = useActiveWorkoutStore.getState()
    expect(state.isResting).toBe(false)
    expect(state.restTargetSeconds).toBe(0)
    expect(state.activeStepIndex).toBe(1)
  })

  it('natural tickRest end calls notifyRestComplete', async () => {
    await useActiveWorkoutStore
      .getState()
      .startWorkoutFromTemplate('Test', [twoSetExercise(90)], 90)
    await useActiveWorkoutStore.getState().completeStep(0, 0, {
      weightKg: 60,
      reps: 5,
    })

    useActiveWorkoutStore.setState({
      restEndsAt: Date.now() - 1_000,
      restSecondsLeft: 0,
    })
    useActiveWorkoutStore.getState().tickRest()

    expect(notifyRestComplete).toHaveBeenCalledTimes(1)
    expect(playRestCompleteBeep).not.toHaveBeenCalled()
  })

  it('skipRest beeps without notifyRestComplete', async () => {
    await useActiveWorkoutStore
      .getState()
      .startWorkoutFromTemplate('Test', [twoSetExercise(90)], 90)
    await useActiveWorkoutStore.getState().completeStep(0, 0, {
      weightKg: 60,
      reps: 5,
    })

    useActiveWorkoutStore.getState().skipRest()

    expect(playRestCompleteBeep).toHaveBeenCalledTimes(1)
    expect(notifyRestComplete).not.toHaveBeenCalled()
    expect(useActiveWorkoutStore.getState().isResting).toBe(false)
  })
})
