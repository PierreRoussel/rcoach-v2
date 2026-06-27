import { create } from 'zustand'

import { db, type ActiveExerciseDraft, type ActiveSetDraft, type ActiveWorkoutDraft } from '@/lib/db/dexie'
import {
  addExerciseToSuperset,
  cleanupSupersetAfterRemoval,
  compactSupersetBlocks,
  removeExerciseFromSuperset,
} from '@/lib/workout/exercise-superset'
import { replaceActiveExercise } from '@/lib/workout/replace-exercise'
import { getExerciseTrackingKind, isTimedExercise } from '@/lib/workout/exercise-tracking'
import {
  playRestCompleteBeep,
  warmUpRestTimerAudio,
} from '@/lib/workout/rest-timer-audio'
import {
  buildCircuitSteps,
  findLastCompletedStep,
  findNextStepIndexAfter,
  getStepRestSeconds,
  getStepLabel,
  isWorkoutComplete,
  resolveLastCompletedStep,
  type CircuitStep,
} from '@/lib/workout/workout-circuit'

export type ActiveSet = ActiveSetDraft
export type ActiveExerciseEntry = ActiveExerciseDraft

type CompleteStepValues = {
  weightKg?: number | null
  reps?: number | null
  rpe?: number | null
  durationSeconds?: number | null
  setType?: ActiveSet['setType']
}

const DEFAULT_HOLD_SECONDS = 30

type PersistableState = Pick<
  ActiveWorkoutState,
  | 'title'
  | 'startedAt'
  | 'defaultRestSeconds'
  | 'sourceTemplateId'
  | 'exercises'
  | 'activeStepIndex'
  | 'lastCompletedStep'
>

type ActiveWorkoutState = {
  title: string
  startedAt: string | null
  defaultRestSeconds: number
  sourceTemplateId: string | null
  exercises: ActiveExerciseEntry[]
  activeStepIndex: number
  lastCompletedStep: CircuitStep | null
  restSecondsLeft: number
  restTargetSeconds: number
  isResting: boolean
  isHolding: boolean
  holdSecondsLeft: number
  holdTargetSeconds: number
  holdingStep: CircuitStep | null
  hydrate: () => Promise<void>
  startWorkout: (title: string) => Promise<void>
  startWorkoutFromTemplate: (
    title: string,
    exercises: ActiveExerciseEntry[],
    defaultRestSeconds?: number,
    sourceTemplateId?: string | null,
  ) => Promise<void>
  addExercise: (exercise: {
    id: string
    name: string
    name_fr?: string | null
    muscle_group?: string | null
    equipment?: string | null
    tracking_mode?: string | null
  }) => Promise<void>
  removeExercise: (exerciseIndex: number) => Promise<void>
  replaceExercise: (
    exerciseIndex: number,
    exercise: {
      id: string
      name: string
      name_fr?: string | null
      muscle_group?: string | null
      equipment?: string | null
    },
  ) => Promise<void>
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
  startHold: (exerciseIndex: number, setIndex: number) => void
  stopHold: () => Promise<void>
  tickHold: () => void
  finishWorkout: () => Promise<ActiveWorkoutDraft | null>
  cancelWorkout: () => Promise<void>
  getCircuitSteps: () => CircuitStep[]
  getCurrentStep: () => CircuitStep | null
  getNextStepLabel: () => string | null
}

function createEmptySet(
  setIndex: number,
  defaultRestSeconds: number,
  options?: { timed?: boolean },
): ActiveSet {
  return {
    setIndex,
    setType: 'normal',
    weightKg: null,
    reps: null,
    durationSeconds: options?.timed ? DEFAULT_HOLD_SECONDS : null,
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
  const { activeStepIndex, lastCompletedStep } = syncWorkoutProgress(
    exercises,
    get().lastCompletedStep,
  )

  set({ exercises, activeStepIndex, lastCompletedStep })
  await persistDraft(get, {
    title: get().title,
    startedAt: get().startedAt,
    defaultRestSeconds: get().defaultRestSeconds,
    exercises,
    activeStepIndex,
    lastCompletedStep,
  })
}

async function persistDraft(
  get: () => ActiveWorkoutState,
  state: Omit<PersistableState, 'sourceTemplateId'> & {
    sourceTemplateId?: string | null
  },
) {
  if (!state.startedAt) {
    return
  }

  const sourceTemplateId =
    state.sourceTemplateId !== undefined
      ? state.sourceTemplateId
      : get().sourceTemplateId

  await db.activeDraft.put({
    id: 'current',
    title: state.title,
    startedAt: state.startedAt,
    defaultRestSeconds: state.defaultRestSeconds,
    sourceTemplateId,
    activeStepIndex: state.activeStepIndex,
    lastCompletedStep: state.lastCompletedStep,
    exercises: state.exercises,
  })
}

function syncWorkoutProgress(
  exercises: ActiveExerciseEntry[],
  storedLastCompleted: CircuitStep | null,
  preferLastCompleted?: CircuitStep | null,
): { activeStepIndex: number; lastCompletedStep: CircuitStep | null } {
  const steps = buildCircuitSteps(exercises)
  const lastCompletedStep =
    preferLastCompleted ??
    resolveLastCompletedStep(exercises, storedLastCompleted)
  const nextIndex = findNextStepIndexAfter(steps, exercises, lastCompletedStep)

  return {
    lastCompletedStep,
    activeStepIndex: nextIndex ?? Math.max(steps.length - 1, 0),
  }
}

function syncAfterExerciseStructureChange(exercises: ActiveExerciseEntry[]) {
  const lastCompletedStep = findLastCompletedStep(exercises)
  return syncWorkoutProgress(exercises, lastCompletedStep, lastCompletedStep)
}

function advanceAfterRest(get: () => ActiveWorkoutState, set: (partial: Partial<ActiveWorkoutState>) => void) {
  void playRestCompleteBeep()

  const { exercises, lastCompletedStep } = get()
  const steps = buildCircuitSteps(exercises)
  const nextIndex = findNextStepIndexAfter(steps, exercises, lastCompletedStep)

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

  void persistDraft(get, {
    title: get().title,
    startedAt: get().startedAt,
    defaultRestSeconds: get().defaultRestSeconds,
    exercises: get().exercises,
    activeStepIndex: nextIndex,
    lastCompletedStep: get().lastCompletedStep,
  })
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  title: '',
  startedAt: null,
  defaultRestSeconds: 90,
  sourceTemplateId: null,
  exercises: [],
  activeStepIndex: 0,
  lastCompletedStep: null,
  restSecondsLeft: 0,
  restTargetSeconds: 0,
  isResting: false,
  isHolding: false,
  holdSecondsLeft: 0,
  holdTargetSeconds: 0,
  holdingStep: null,

  getCircuitSteps: () => buildCircuitSteps(get().exercises),

  getCurrentStep: () => {
    const steps = buildCircuitSteps(get().exercises)
    return steps[get().activeStepIndex] ?? null
  },

  getNextStepLabel: () => {
    const steps = buildCircuitSteps(get().exercises)
    const nextIndex = findNextStepIndexAfter(
      steps,
      get().exercises,
      get().lastCompletedStep,
    )
    return getStepLabel(get().exercises, nextIndex != null ? steps[nextIndex] ?? null : null)
  },

  hydrate: async () => {
    const draft = await db.activeDraft.get('current')
    if (!draft) {
      return
    }

    const exercises = draft.exercises
    const lastCompletedStep = resolveLastCompletedStep(
      exercises,
      draft.lastCompletedStep ?? null,
    )
    const { activeStepIndex } = syncWorkoutProgress(
      exercises,
      lastCompletedStep,
      lastCompletedStep,
    )

    set({
      title: draft.title,
      startedAt: draft.startedAt,
      defaultRestSeconds: draft.defaultRestSeconds ?? 90,
      sourceTemplateId: draft.sourceTemplateId ?? null,
      exercises,
      activeStepIndex,
      lastCompletedStep,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
      isHolding: false,
      holdSecondsLeft: 0,
      holdTargetSeconds: 0,
      holdingStep: null,
    })
  },

  startWorkout: async (title) => {
    const startedAt = new Date().toISOString()
    set({
      title,
      startedAt,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
      isHolding: false,
      holdSecondsLeft: 0,
      holdTargetSeconds: 0,
      holdingStep: null,
    })
    await persistDraft(get, {
      title,
      startedAt,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
    })
  },

  startWorkoutFromTemplate: async (
    title,
    exercises,
    defaultRestSeconds = 90,
    sourceTemplateId = null,
  ) => {
    const startedAt = new Date().toISOString()
    const { activeStepIndex, lastCompletedStep } = syncAfterExerciseStructureChange(exercises)

    set({
      title,
      startedAt,
      defaultRestSeconds,
      sourceTemplateId,
      exercises,
      activeStepIndex,
      lastCompletedStep,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
      isHolding: false,
      holdSecondsLeft: 0,
      holdTargetSeconds: 0,
      holdingStep: null,
    })
    await persistDraft(get, {
      title,
      startedAt,
      defaultRestSeconds,
      sourceTemplateId,
      exercises,
      activeStepIndex,
      lastCompletedStep,
    })
  },

  addExercise: async (exercise) => {
    if (get().exercises.some((item) => item.exerciseId === exercise.id)) {
      return
    }

    const defaultRestSeconds = get().defaultRestSeconds
    const timed = isTimedExercise({
      name: exercise.name,
      equipment: exercise.equipment ?? null,
      tracking_mode: exercise.tracking_mode ?? null,
    })
    const nextExercises = [
      ...get().exercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseNameFr: exercise.name_fr ?? null,
        muscleGroup: exercise.muscle_group ?? null,
        equipment: exercise.equipment ?? null,
        supersetId: null,
        defaultRestSeconds,
        sets: [createEmptySet(0, defaultRestSeconds, { timed })],
      },
    ]
    const { activeStepIndex, lastCompletedStep } =
      syncAfterExerciseStructureChange(nextExercises)

    set({ exercises: nextExercises, activeStepIndex, lastCompletedStep })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
      activeStepIndex,
      lastCompletedStep,
    })
  },

  removeExercise: async (exerciseIndex) => {
    const nextExercises = cleanupSupersetAfterRemoval(
      get().exercises.filter((_, index) => index !== exerciseIndex),
    )
    const { activeStepIndex, lastCompletedStep } =
      syncAfterExerciseStructureChange(nextExercises)

    set({ exercises: nextExercises, activeStepIndex, lastCompletedStep })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
      activeStepIndex,
      lastCompletedStep,
    })
  },

  replaceExercise: async (exerciseIndex, exercise) => {
    const current = get().exercises[exerciseIndex]
    if (!current || current.exerciseId === exercise.id) {
      return
    }

    if (
      get().exercises.some(
        (entry, index) => index !== exerciseIndex && entry.exerciseId === exercise.id,
      )
    ) {
      return
    }

    const nextExercises = get().exercises.map((entry, index) =>
      index === exerciseIndex ? replaceActiveExercise(entry, exercise) : entry,
    )
    const { activeStepIndex, lastCompletedStep } =
      syncAfterExerciseStructureChange(nextExercises)

    set({ exercises: nextExercises, activeStepIndex, lastCompletedStep })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
      activeStepIndex,
      lastCompletedStep,
    })
  },

  reorderExercises: async (fromIndex, toIndex) => {
    const exercises = [...get().exercises]
    const [moved] = exercises.splice(fromIndex, 1)
    if (!moved) {
      return
    }
    exercises.splice(toIndex, 0, moved)

    const compacted = compactSupersetBlocks(exercises)
    const { activeStepIndex, lastCompletedStep } =
      syncAfterExerciseStructureChange(compacted)

    set({ exercises: compacted, activeStepIndex, lastCompletedStep })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: compacted,
      activeStepIndex,
      lastCompletedStep,
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
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  addToSuperset: async (fromIndex, partnerIndex) => {
    const exercises = addExerciseToSuperset(get().exercises, fromIndex, partnerIndex)
    const { activeStepIndex, lastCompletedStep } = syncAfterExerciseStructureChange(exercises)

    set({ exercises, activeStepIndex, lastCompletedStep })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
      lastCompletedStep,
    })
  },

  removeFromSuperset: async (exerciseIndex) => {
    const exercises = removeExerciseFromSuperset(get().exercises, exerciseIndex)
    const { activeStepIndex, lastCompletedStep } = syncAfterExerciseStructureChange(exercises)

    set({ exercises, activeStepIndex, lastCompletedStep })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
      lastCompletedStep,
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
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
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
            durationSeconds: inherited?.durationSeconds ?? null,
            restSeconds: inherited?.restSeconds ?? exercise.defaultRestSeconds ?? get().defaultRestSeconds,
            completedAt: null,
          },
        ],
      }
    })

    set({ exercises })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
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
    void persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: get().exercises,
      activeStepIndex: stepIndex,
      lastCompletedStep: get().lastCompletedStep,
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
    if (get().isHolding) {
      return
    }

    const targetSet = get().exercises[exerciseIndex]?.sets[setIndex]
    if (!targetSet || targetSet.completedAt) {
      return
    }

    void warmUpRestTimerAudio()

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
            durationSeconds:
              values?.durationSeconds !== undefined
                ? values.durationSeconds
                : set.durationSeconds,
            setType: values?.setType ?? set.setType,
            completedAt: now,
          }
        }),
      }
    })

    const steps = buildCircuitSteps(exercises)
    const completedStep = { exerciseIndex, setIndex }
    const lastCompletedStep = completedStep
    const completedStepIndex = steps.findIndex(
      (step) => step.exerciseIndex === exerciseIndex && step.setIndex === setIndex,
    )
    const nextStepIndex = findNextStepIndexAfter(steps, exercises, completedStep)
    const nextStep = nextStepIndex != null ? steps[nextStepIndex] ?? null : null
    const restSeconds = getStepRestSeconds(
      exercises,
      completedStep,
      nextStep,
      get().defaultRestSeconds,
    )

    let activeStepIndex = nextStepIndex ?? Math.max(steps.length - 1, 0)

    if (nextStepIndex == null || isWorkoutComplete(steps, exercises, lastCompletedStep)) {
      activeStepIndex = Math.max(steps.length - 1, 0)
      set({
        exercises,
        lastCompletedStep,
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
        lastCompletedStep,
        activeStepIndex,
        isResting: true,
        restSecondsLeft: restSeconds,
        restTargetSeconds: restSeconds,
      })
    } else {
      set({
        exercises,
        lastCompletedStep,
        activeStepIndex,
        isResting: false,
        restSecondsLeft: 0,
        restTargetSeconds: 0,
      })
    }

    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
      lastCompletedStep,
    })
  },

  uncompleteStep: async (exerciseIndex, setIndex) => {
    const targetSet = get().exercises[exerciseIndex]?.sets[setIndex]
    if (!targetSet?.completedAt) {
      const holding = get().holdingStep
      if (
        get().isHolding &&
        holding?.exerciseIndex === exerciseIndex &&
        holding?.setIndex === setIndex
      ) {
        set({
          isHolding: false,
          holdSecondsLeft: 0,
          holdTargetSeconds: 0,
          holdingStep: null,
        })
      }
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

    const lastCompletedStep = findLastCompletedStep(exercises)
    const { activeStepIndex } = syncWorkoutProgress(exercises, null, lastCompletedStep)

    set({
      exercises,
      lastCompletedStep,
      activeStepIndex,
      isResting: false,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isHolding: false,
      holdSecondsLeft: 0,
      holdTargetSeconds: 0,
      holdingStep: null,
    })

    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex,
      lastCompletedStep,
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

  startHold: (exerciseIndex, setIndex) => {
    if (get().isResting || get().isHolding) {
      return
    }

    const exercise = get().exercises[exerciseIndex]
    const targetSet = exercise?.sets[setIndex]
    if (!exercise || !targetSet || targetSet.completedAt) {
      return
    }

    const kind = getExerciseTrackingKind({
      name: exercise.exerciseName,
      equipment: exercise.equipment ?? null,
    })
    if (kind !== 'timed') {
      return
    }

    void warmUpRestTimerAudio()

    const target = Math.max(
      1,
      targetSet.durationSeconds ?? DEFAULT_HOLD_SECONDS,
    )

    set({
      isHolding: true,
      holdSecondsLeft: target,
      holdTargetSeconds: target,
      holdingStep: { exerciseIndex, setIndex },
    })
  },

  stopHold: async () => {
    if (!get().isHolding || !get().holdingStep) {
      return
    }

    const elapsed = Math.max(
      1,
      get().holdTargetSeconds - get().holdSecondsLeft,
    )
    const { exerciseIndex, setIndex } = get().holdingStep

    set({
      isHolding: false,
      holdSecondsLeft: 0,
      holdTargetSeconds: 0,
      holdingStep: null,
    })

    await get().completeStep(exerciseIndex, setIndex, {
      durationSeconds: elapsed,
    })
  },

  tickHold: () => {
    if (!get().isHolding || !get().holdingStep) {
      return
    }

    const next = get().holdSecondsLeft - 1
    if (next <= 0) {
      void playRestCompleteBeep()
      const { exerciseIndex, setIndex } = get().holdingStep
      const target = get().holdTargetSeconds

      set({
        isHolding: false,
        holdSecondsLeft: 0,
        holdTargetSeconds: 0,
        holdingStep: null,
      })

      void get().completeStep(exerciseIndex, setIndex, {
        durationSeconds: target,
      })
      return
    }

    set({ holdSecondsLeft: next })
  },

  finishWorkout: async () => {
    const { title, startedAt, exercises, defaultRestSeconds, sourceTemplateId } = get()
    if (!startedAt) {
      return null
    }

    const draft: ActiveWorkoutDraft = {
      id: 'current',
      title,
      startedAt,
      defaultRestSeconds,
      sourceTemplateId,
      exercises,
    }

    await db.activeDraft.delete('current')
    set({
      title: '',
      startedAt: null,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
      isHolding: false,
      holdSecondsLeft: 0,
      holdTargetSeconds: 0,
      holdingStep: null,
    })

    return draft
  },

  cancelWorkout: async () => {
    await db.activeDraft.delete('current')
    set({
      title: '',
      startedAt: null,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
      restSecondsLeft: 0,
      restTargetSeconds: 0,
      isResting: false,
    })
  },
}))
