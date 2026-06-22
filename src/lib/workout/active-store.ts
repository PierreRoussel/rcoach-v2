import { create } from 'zustand'

import { db, type ActiveExerciseDraft, type ActiveSetDraft, type ActiveWorkoutDraft } from '@/lib/db/dexie'
import {
  addExerciseToSuperset,
  cleanupSupersetAfterRemoval,
  removeExerciseFromSuperset,
} from '@/lib/workout/exercise-superset'
import {
  buildCircuitSteps,
  findHighestCompletedStepIndex,
  findNextPendingStepIndex,
  getStepRestSeconds,
  getStepLabel,
  isWorkoutComplete,
  type CircuitStep,
} from '@/lib/workout/workout-circuit'

export type ActiveSet = ActiveSetDraft
export type ActiveExerciseEntry = ActiveExerciseDraft

type CompleteStepValues = {
  weightKg?: number | null
  reps?: number | null
  rpe?: number | null
  setType?: ActiveSet['setType']
}

type PersistableState = Pick<
  ActiveWorkoutState,
  'title' | 'startedAt' | 'defaultRestSeconds' | 'exercises' | 'activeStepIndex'
>

type ActiveWorkoutState = {
  title: string
  startedAt: string | null
  defaultRestSeconds: number
  exercises: ActiveExerciseEntry[]
  activeStepIndex: number
  restSecondsLeft: number
  restTargetSeconds: number
  isResting: boolean
  hydrate: () => Promise<void>
  startWorkout: (title: string) => Promise<void>
  startWorkoutFromTemplate: (
    title: string,
    exercises: ActiveExerciseEntry[],
    defaultRestSeconds?: number,
  ) => Promise<void>
  addExercise: (exercise: {
    id: string
    name: string
    muscle_group?: string | null
    equipment?: string | null
  }) => Promise<void>
  removeExercise: (exerciseIndex: number) => Promise<void>
  reorderExercises: (fromIndex: number, toIndex: number) => Promise<void>
  updateExerciseDefaultRest: (exerciseIndex: number, restSeconds: number) => Promise<void>
  addToSuperset: (fromIndex: number, partnerIndex: number) => Promise<void>
  removeFromSuperset: (exerciseIndex: number) => Promise<void>
  updatePlannedSet: (
    exerciseIndex: number,
    setIndex: number,
    patch: Partial<ActiveSet>,
  ) => Promise<void>
  addPlannedSet: (exerciseIndex: number) => Promise<void>
  removePlannedSet: (exerciseIndex: number, setIndex: number) => Promise<void>
  reorderPlannedSets: (
    exerciseIndex: number,
    fromIndex: number,
    toIndex: number,
  ) => Promise<void>
  completeCurrentStep: (values?: CompleteStepValues) => Promise<void>
  completeStep: (
    exerciseIndex: number,
    setIndex: number,
    values?: CompleteStepValues,
  ) => Promise<void>
  uncompleteStep: (exerciseIndex: number, setIndex: number) => Promise<void>
  goToStep: (stepIndex: number) => void
  startRest: (seconds: number) => void
  adjustRest: (deltaSeconds: number) => void
  tickRest: () => void
  skipRest: () => void
  finishWorkout: () => Promise<ActiveWorkoutDraft | null>
  cancelWorkout: () => Promise<void>
  getCircuitSteps: () => CircuitStep[]
  getCurrentStep: () => CircuitStep | null
  getNextStepLabel: () => string | null
}

function createEmptySet(setIndex: number, defaultRestSeconds: number): ActiveSet {
  return {
    setIndex,
    setType: 'normal',
    weightKg: null,
    reps: null,
    restSeconds: defaultRestSeconds,
    completedAt: null,
  }
}

function reindexExerciseSets(sets: ActiveSet[]): ActiveSet[] {
  return sets.map((set, index) => ({ ...set, setIndex: index }))
}

async function applyExerciseSetsChange(
  get: () => ActiveWorkoutState,
  set: (partial: Partial<ActiveWorkoutState>) => void,
  exerciseIndex: number,
  nextSets: ActiveSet[],
) {
  const exercises = get().exercises.map((exercise, index) =>
    index === exerciseIndex
      ? { ...exercise, sets: reindexExerciseSets(nextSets) }
      : exercise,
  )
  const activeStepIndex = syncActiveStepIndex(exercises, get().activeStepIndex)

  set({ exercises, activeStepIndex })
  await persistDraft({
    title: get().title,
    startedAt: get().startedAt,
    defaultRestSeconds: get().defaultRestSeconds,
    exercises,
    activeStepIndex,
  })
}

async function persistDraft(state: PersistableState) {
  if (!state.startedAt) {
    return
  }

  await db.activeDraft.put({
    id: 'current',
    title: state.title,
    startedAt: state.startedAt,
    defaultRestSeconds: state.defaultRestSeconds,
    activeStepIndex: state.activeStepIndex,
    exercises: state.exercises,
  })
}

function syncActiveStepIndex(
  exercises: ActiveExerciseEntry[],
  preferredIndex = 0,
): number {
  const steps = buildCircuitSteps(exercises)
  const anchor = Math.max(
    preferredIndex,
    findHighestCompletedStepIndex(steps, exercises),
  )
  const pending = findNextPendingStepIndex(steps, exercises, anchor)

  if (pending != null) {
    return pending
  }

  return Math.max(steps.length - 1, 0)
}

function advanceAfterRest(get: () => ActiveWorkoutState, set: (partial: Partial<ActiveWorkoutState>) => void) {
  const { exercises, activeStepIndex } = get()
  const steps = buildCircuitSteps(exercises)
  const nextIndex = findNextPendingStepIndex(steps, exercises, activeStepIndex + 1)

  if (nextIndex == null) {
    set({ isResting: false, restSecondsLeft: 0, restTargetSeconds: 0 })
    return
  }

  set({
    activeStepIndex: nextIndex,
    isResting: false,
    restSecondsLeft: 0,
    restTargetSeconds: 0,
  })

  void persistDraft({
    title: get().title,
    startedAt: get().startedAt,
    defaultRestSeconds: get().defaultRestSeconds,
    exercises: get().exercises,
    activeStepIndex: nextIndex,
  })
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  title: '',
  startedAt: null,
  defaultRestSeconds: 90,
  exercises: [],
  activeStepIndex: 0,
  restSecondsLeft: 0,
  restTargetSeconds: 0,
  isResting: false,

  getCircuitSteps: () => buildCircuitSteps(get().exercises),

  getCurrentStep: () => {
    const steps = buildCircuitSteps(get().exercises)
    return steps[get().activeStepIndex] ?? null
  },

  getNextStepLabel: () => {
    const steps = buildCircuitSteps(get().exercises)
    const nextIndex = findNextPendingStepIndex(steps, get().exercises, get().activeStepIndex + 1)
    return getStepLabel(get().exercises, nextIndex != null ? steps[nextIndex] ?? null : null)
  },

  hydrate: async () => {
    const draft = await db.activeDraft.get('current')
    if (!draft) {
      return
    }

    const exercises = draft.exercises
    const activeStepIndex = syncActiveStepIndex(exercises, draft.activeStepIndex ?? 0)

    set({
      title: draft.title,
      startedAt: draft.startedAt,
      defaultRestSeconds: draft.defaultRestSeconds ?? 90,
      exercises,
      activeStepIndex,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
    })
  },

  startWorkout: async (title) => {
    const startedAt = new Date().toISOString()
    set({
      title,
      startedAt,
      defaultRestSeconds: 90,
      exercises: [],
      activeStepIndex: 0,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
    })
    await persistDraft({
      title,
      startedAt,
      defaultRestSeconds: 90,
      exercises: [],
      activeStepIndex: 0,
    })
  },

  startWorkoutFromTemplate: async (title, exercises, defaultRestSeconds = 90) => {
    const startedAt = new Date().toISOString()
    const activeStepIndex = syncActiveStepIndex(exercises, 0)

    set({
      title,
      startedAt,
      defaultRestSeconds,
      exercises,
      activeStepIndex,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
    })
    await persistDraft({
      title,
      startedAt,
      defaultRestSeconds,
      exercises,
      activeStepIndex,
    })
  },

  addExercise: async (exercise) => {
    if (get().exercises.some((item) => item.exerciseId === exercise.id)) {
      return
    }

    const defaultRestSeconds = get().defaultRestSeconds
    const nextExercises = [
      ...get().exercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscle_group ?? null,
        equipment: exercise.equipment ?? null,
        supersetId: null,
        defaultRestSeconds,
        sets: [createEmptySet(0, defaultRestSeconds)],
      },
    ]
    const activeStepIndex = syncActiveStepIndex(nextExercises, get().activeStepIndex)

    set({ exercises: nextExercises, activeStepIndex })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
      activeStepIndex,
    })
  },

  removeExercise: async (exerciseIndex) => {
    const nextExercises = cleanupSupersetAfterRemoval(
      get().exercises.filter((_, index) => index !== exerciseIndex),
    )
    const activeStepIndex = syncActiveStepIndex(nextExercises, 0)

    set({ exercises: nextExercises, activeStepIndex })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
      activeStepIndex,
    })
  },

  reorderExercises: async (fromIndex, toIndex) => {
    const exercises = [...get().exercises]
    const [moved] = exercises.splice(fromIndex, 1)
    if (!moved) {
      return
    }
    exercises.splice(toIndex, 0, moved)

    const activeStepIndex = syncActiveStepIndex(exercises, 0)

    set({ exercises, activeStepIndex })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
    })
  },

  updateExerciseDefaultRest: async (exerciseIndex, restSeconds) => {
    const normalized = Math.max(0, restSeconds)
    const exercises = get().exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return exercise
      }

      return {
        ...exercise,
        defaultRestSeconds: normalized,
        sets: exercise.sets.map((set) => ({
          ...set,
          restSeconds: normalized,
        })),
      }
    })

    set({ exercises })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
    })
  },

  addToSuperset: async (fromIndex, partnerIndex) => {
    const exercises = addExerciseToSuperset(get().exercises, fromIndex, partnerIndex)
    const activeStepIndex = syncActiveStepIndex(exercises, get().activeStepIndex)

    set({ exercises, activeStepIndex })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
    })
  },

  removeFromSuperset: async (exerciseIndex) => {
    const exercises = removeExerciseFromSuperset(get().exercises, exerciseIndex)
    const activeStepIndex = syncActiveStepIndex(exercises, get().activeStepIndex)

    set({ exercises, activeStepIndex })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
    })
  },

  updatePlannedSet: async (exerciseIndex, setIndex, patch) => {
    const exercises = get().exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return exercise
      }

      return {
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.setIndex === setIndex ? { ...set, ...patch } : set,
        ),
      }
    })

    set({ exercises })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
    })
  },

  addPlannedSet: async (exerciseIndex) => {
    const exercises = get().exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return exercise
      }

      const nextIndex = exercise.sets.length
      const inherited = exercise.sets.at(-1)

      return {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            setIndex: nextIndex,
            setType: inherited?.setType ?? 'normal',
            weightKg: inherited?.weightKg ?? null,
            reps: inherited?.reps ?? null,
            restSeconds: inherited?.restSeconds ?? exercise.defaultRestSeconds ?? get().defaultRestSeconds,
            completedAt: null,
          },
        ],
      }
    })

    set({ exercises })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
    })
  },

  removePlannedSet: async (exerciseIndex, setIndex) => {
    const exercise = get().exercises[exerciseIndex]
    if (!exercise || exercise.sets.length <= 1) {
      return
    }

    const nextSets = exercise.sets.filter((set) => set.setIndex !== setIndex)
    await applyExerciseSetsChange(get, set, exerciseIndex, nextSets)
  },

  reorderPlannedSets: async (exerciseIndex, fromIndex, toIndex) => {
    const exercise = get().exercises[exerciseIndex]
    if (!exercise || fromIndex === toIndex) {
      return
    }

    const sets = [...exercise.sets]
    const [moved] = sets.splice(fromIndex, 1)
    if (!moved) {
      return
    }

    sets.splice(toIndex, 0, moved)
    await applyExerciseSetsChange(get, set, exerciseIndex, sets)
  },

  goToStep: (stepIndex) => {
    const steps = buildCircuitSteps(get().exercises)
    if (stepIndex < 0 || stepIndex >= steps.length) {
      return
    }

    set({ activeStepIndex: stepIndex, isResting: false, restSecondsLeft: 0, restTargetSeconds: 0 })
    void persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: get().exercises,
      activeStepIndex: stepIndex,
    })
  },

  completeCurrentStep: async (values) => {
    const step = get().getCurrentStep()
    if (!step) {
      return
    }

    await get().completeStep(step.exerciseIndex, step.setIndex, values)
  },

  completeStep: async (exerciseIndex, setIndex, values) => {
    const targetSet = get().exercises[exerciseIndex]?.sets[setIndex]
    if (!targetSet || targetSet.completedAt) {
      return
    }

    const now = new Date().toISOString()
    const exercises = get().exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return exercise
      }

      return {
        ...exercise,
        sets: exercise.sets.map((set) => {
          if (set.setIndex !== setIndex) {
            return set
          }

          return {
            ...set,
            weightKg: values?.weightKg !== undefined ? values.weightKg : set.weightKg,
            reps: values?.reps !== undefined ? values.reps : set.reps,
            rpe: values?.rpe !== undefined ? values.rpe : set.rpe,
            setType: values?.setType ?? set.setType,
            completedAt: now,
          }
        }),
      }
    })

    const steps = buildCircuitSteps(exercises)
    const completedStep = { exerciseIndex, setIndex }
    const completedStepIndex = steps.findIndex(
      (step) => step.exerciseIndex === exerciseIndex && step.setIndex === setIndex,
    )
    const syncedStepIndex = syncActiveStepIndex(
      exercises,
      completedStepIndex >= 0 ? completedStepIndex : get().activeStepIndex,
    )
    const nextStepIndex = findNextPendingStepIndex(
      steps,
      exercises,
      completedStepIndex >= 0 ? completedStepIndex + 1 : syncedStepIndex,
    )
    const nextStep = nextStepIndex != null ? steps[nextStepIndex] ?? null : null
    const restSeconds = getStepRestSeconds(
      exercises,
      completedStep,
      nextStep,
      get().defaultRestSeconds,
    )

    let activeStepIndex = syncedStepIndex

    if (nextStepIndex == null || isWorkoutComplete(steps, exercises)) {
      activeStepIndex = Math.max(steps.length - 1, 0)
      set({
        exercises,
        activeStepIndex,
        isResting: false,
        restSecondsLeft: 0,
        restTargetSeconds: 0,
      })
    } else if (restSeconds > 0) {
      activeStepIndex =
        completedStepIndex >= 0 ? completedStepIndex : get().activeStepIndex
      set({
        exercises,
        activeStepIndex,
        isResting: true,
        restSecondsLeft: restSeconds,
        restTargetSeconds: restSeconds,
      })
    } else {
      set({
        exercises,
        activeStepIndex,
        isResting: false,
        restSecondsLeft: 0,
        restTargetSeconds: 0,
      })
    }

    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
    })
  },

  uncompleteStep: async (exerciseIndex, setIndex) => {
    const targetSet = get().exercises[exerciseIndex]?.sets[setIndex]
    if (!targetSet?.completedAt) {
      return
    }

    const exercises = get().exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return exercise
      }

      return {
        ...exercise,
        sets: exercise.sets.map((set) =>
          set.setIndex === setIndex ? { ...set, completedAt: null } : set,
        ),
      }
    })

    const steps = buildCircuitSteps(exercises)
    const uncompletedStepIndex = steps.findIndex(
      (step) => step.exerciseIndex === exerciseIndex && step.setIndex === setIndex,
    )
    const activeStepIndex =
      uncompletedStepIndex >= 0
        ? uncompletedStepIndex
        : syncActiveStepIndex(exercises, get().activeStepIndex)

    set({
      exercises,
      activeStepIndex,
      isResting: false,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
    })

    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
    })
  },

  startRest: (seconds) => {
    const normalized = Math.max(0, seconds)
    set({
      isResting: true,
      restSecondsLeft: normalized,
      restTargetSeconds: normalized,
    })
  },

  adjustRest: (deltaSeconds) => {
    const next = Math.max(0, get().restSecondsLeft + deltaSeconds)
    const target = Math.max(0, get().restTargetSeconds + deltaSeconds)
    set({ restSecondsLeft: next, restTargetSeconds: target })
  },

  tickRest: () => {
    if (!get().isResting) {
      return
    }

    const next = get().restSecondsLeft - 1
    if (next <= 0) {
      advanceAfterRest(get, set)
      return
    }

    set({ restSecondsLeft: next })
  },

  skipRest: () => {
    if (!get().isResting) {
      return
    }

    advanceAfterRest(get, set)
  },

  finishWorkout: async () => {
    const { title, startedAt, exercises, defaultRestSeconds } = get()
    if (!startedAt) {
      return null
    }

    const draft: ActiveWorkoutDraft = {
      id: 'current',
      title,
      startedAt,
      defaultRestSeconds,
      exercises,
    }

    await db.activeDraft.delete('current')
    set({
      title: '',
      startedAt: null,
      defaultRestSeconds: 90,
      exercises: [],
      activeStepIndex: 0,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
    })

    return draft
  },

  cancelWorkout: async () => {
    await db.activeDraft.delete('current')
    set({
      title: '',
      startedAt: null,
      defaultRestSeconds: 90,
      exercises: [],
      activeStepIndex: 0,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
    })
  },
}))
