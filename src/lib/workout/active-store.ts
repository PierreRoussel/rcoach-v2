import { create } from 'zustand'

import { db, type ActiveExerciseDraft, type ActiveSetDraft, type ActiveWorkoutDraft } from '@/lib/db/dexie'
import {
  applyEmomGroupMembership as mergeEmomGroupMembership,
  cleanupEmomGroupAfterRemoval,
  compactEmomGroupBlocks,
  removeExerciseFromEmomGroup,
} from '@/lib/workout/exercise-emom-group'
import {
  applySupersetMembership as mergeSupersetMembership,
  cleanupSupersetAfterRemoval,
  compactSupersetBlocks,
  removeExerciseFromSuperset,
} from '@/lib/workout/exercise-superset'
import {
  createInitialEmomState,
  logEmomMinuteState,
  normalizeEmomState,
  skipToNextMinuteState,
  syncEmomSecondsLeft,
  tickEmomState,
  type EmomTimerState,
} from '@/lib/workout/emom-store'
import { handleEmomTickEvents } from '@/lib/workout/emom-timer-feedback'
import { replaceActiveExercise } from '@/lib/workout/replace-exercise'
import { getExerciseTrackingKind, isTimedExercise } from '@/lib/workout/exercise-tracking'
import {
  playRestCompleteBeep,
  warmUpRestTimerAudio,
} from '@/lib/workout/rest-timer-audio'
import {
  DEFAULT_EMOM_INTERVAL_SECONDS,
  DEFAULT_SESSION_MODE,
  normalizeSessionMode,
  type SessionMode,
} from '@/lib/workout/session-mode'
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
import {
  snapshotExerciseLineup,
  type TemplateExerciseLineSnapshot,
} from '@/lib/workout/template-lineup'

export type ActiveSet = ActiveSetDraft
export type ActiveExerciseEntry = ActiveExerciseDraft
export type ActiveEmomState = EmomTimerState

export type StartWorkoutOptions = {
  sessionMode?: SessionMode
  emom?: {
    intervalSeconds: number
    totalMinutes: number
    countdownSeconds?: number
  }
}

type CompleteStepValues = {
  weightKg?: number | null
  reps?: number | null
  rpe?: number | null
  durationSeconds?: number | null
  setType?: ActiveSet['setType']
}

const DEFAULT_HOLD_SECONDS = 30

function createRestTimerState(seconds: number) {
  const normalized = Math.max(0, Math.round(seconds))

  if (normalized <= 0) {
    return clearRestTimerState()
  }

  return {
    isResting: true,
    restSecondsLeft: normalized,
    restTargetSeconds: normalized,
    restEndsAt: Date.now() + normalized * 1_000,
  }
}

function clearRestTimerState() {
  return {
    isResting: false,
    restSecondsLeft: 0,
    restTargetSeconds: 0,
    restEndsAt: null as number | null,
  }
}

function createHoldTimerState(seconds: number, holdingStep: CircuitStep) {
  const normalized = Math.max(1, Math.round(seconds))

  return {
    isHolding: true,
    holdSecondsLeft: normalized,
    holdTargetSeconds: normalized,
    holdEndsAt: Date.now() + normalized * 1_000,
    holdingStep,
  }
}

function clearHoldTimerState() {
  return {
    isHolding: false,
    holdSecondsLeft: 0,
    holdTargetSeconds: 0,
    holdEndsAt: null as number | null,
    holdingStep: null as CircuitStep | null,
  }
}

function syncRestSecondsLeft(restEndsAt: number | null) {
  if (restEndsAt == null) {
    return 0
  }

  return Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1_000))
}

function syncHoldSecondsLeft(holdEndsAt: number | null) {
  if (holdEndsAt == null) {
    return 0
  }

  return Math.max(0, Math.ceil((holdEndsAt - Date.now()) / 1_000))
}

const IDLE_TIMER_STATE = {
  ...clearRestTimerState(),
  ...clearHoldTimerState(),
}

type PersistableState = Pick<
  ActiveWorkoutState,
  | 'title'
  | 'startedAt'
  | 'sessionMode'
  | 'emom'
  | 'defaultRestSeconds'
  | 'sourceTemplateId'
  | 'sourceTemplateExerciseLineup'
  | 'exercises'
  | 'activeStepIndex'
  | 'lastCompletedStep'
>

type ActiveWorkoutState = {
  title: string
  startedAt: string | null
  sessionMode: SessionMode
  emom: ActiveEmomState | null
  defaultRestSeconds: number
  sourceTemplateId: string | null
  sourceTemplateExerciseLineup: TemplateExerciseLineSnapshot[] | null
  exercises: ActiveExerciseEntry[]
  activeStepIndex: number
  lastCompletedStep: CircuitStep | null
  restSecondsLeft: number
  restTargetSeconds: number
  restEndsAt: number | null
  isResting: boolean
  isHolding: boolean
  holdSecondsLeft: number
  holdTargetSeconds: number
  holdEndsAt: number | null
  holdingStep: CircuitStep | null
  hydrate: () => Promise<void>
  startWorkout: (title: string, options?: StartWorkoutOptions) => Promise<void>
  startWorkoutFromTemplate: (
    title: string,
    exercises: ActiveExerciseEntry[],
    defaultRestSeconds?: number,
    sourceTemplateId?: string | null,
    options?: StartWorkoutOptions,
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
  applySupersetMembership: (anchorIndex: number, partnerIndices: number[]) => Promise<void>
  removeFromSuperset: (exerciseIndex: number) => Promise<void>
  applyEmomGroupMembership: (anchorIndex: number, partnerIndices: number[]) => Promise<void>
  removeFromEmomGroup: (exerciseIndex: number) => Promise<void>
  updateExerciseTargetReps: (exerciseIndex: number, targetReps: number | null) => Promise<void>
  updateExerciseTargetWeight: (
    exerciseIndex: number,
    targetWeightKg: number | null,
  ) => Promise<void>
  tickEmom: () => void
  logEmomMinute: (minuteIndex?: number) => Promise<void>
  skipEmomMinute: () => Promise<void>
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
  state: Omit<PersistableState, 'sourceTemplateId' | 'sourceTemplateExerciseLineup'> & {
    sourceTemplateId?: string | null
    sourceTemplateExerciseLineup?: TemplateExerciseLineSnapshot[] | null
  },
) {
  if (!state.startedAt) {
    return
  }

  const sourceTemplateId =
    state.sourceTemplateId !== undefined
      ? state.sourceTemplateId
      : get().sourceTemplateId
  const sourceTemplateExerciseLineup =
    state.sourceTemplateExerciseLineup !== undefined
      ? state.sourceTemplateExerciseLineup
      : get().sourceTemplateExerciseLineup

  await db.activeDraft.put({
    id: 'current',
    title: state.title,
    startedAt: state.startedAt,
    sessionMode: state.sessionMode ?? get().sessionMode,
    emom: state.emom !== undefined ? state.emom : get().emom ?? undefined,
    defaultRestSeconds: state.defaultRestSeconds,
    sourceTemplateId,
    sourceTemplateExerciseLineup,
    activeStepIndex: state.activeStepIndex,
    lastCompletedStep: state.lastCompletedStep,
    exercises: state.exercises,
  })
}

function resolveStartWorkoutState(options?: StartWorkoutOptions) {
  const sessionMode = normalizeSessionMode(options?.sessionMode)
  const emom =
    sessionMode === 'emom' && options?.emom
      ? createInitialEmomState(
          options.emom.intervalSeconds ?? DEFAULT_EMOM_INTERVAL_SECONDS,
          options.emom.totalMinutes,
          { countdownSeconds: options.emom.countdownSeconds },
        )
      : null

  return { sessionMode, emom }
}

function compactExercisesAfterStructureChange(
  sessionMode: SessionMode,
  exercises: ActiveExerciseEntry[],
) {
  return sessionMode === 'emom'
    ? compactEmomGroupBlocks(exercises)
    : compactSupersetBlocks(exercises)
}

function cleanupExercisesAfterRemoval(
  sessionMode: SessionMode,
  exercises: ActiveExerciseEntry[],
) {
  return sessionMode === 'emom'
    ? cleanupEmomGroupAfterRemoval(exercises)
    : cleanupSupersetAfterRemoval(exercises)
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
    set(clearRestTimerState())
    return
  }

  set({
    activeStepIndex: nextIndex,
    ...clearRestTimerState(),
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
  sessionMode: DEFAULT_SESSION_MODE,
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
      sessionMode: normalizeSessionMode(draft.sessionMode),
      emom: draft.emom ? normalizeEmomState(draft.emom) : null,
      defaultRestSeconds: draft.defaultRestSeconds ?? 90,
      sourceTemplateId: draft.sourceTemplateId ?? null,
      sourceTemplateExerciseLineup: draft.sourceTemplateExerciseLineup ?? null,
      exercises,
      activeStepIndex,
      lastCompletedStep,
      ...IDLE_TIMER_STATE,
    })

    if (draft.emom?.emomEndsAt != null) {
      const secondsLeft = syncEmomSecondsLeft(draft.emom.emomEndsAt)
      set({
        emom: {
          ...draft.emom,
          secondsLeftInMinute: secondsLeft,
        },
      })
    }
  },

  startWorkout: async (title, options) => {
    const startedAt = new Date().toISOString()
    const { sessionMode, emom } = resolveStartWorkoutState(options)
    set({
      title,
      startedAt,
      sessionMode,
      emom,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      sourceTemplateExerciseLineup: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
      ...IDLE_TIMER_STATE,
    })
    await persistDraft(get, {
      title,
      startedAt,
      sessionMode,
      emom,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      sourceTemplateExerciseLineup: null,
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
    options,
  ) => {
    const startedAt = new Date().toISOString()
    const { sessionMode, emom } = resolveStartWorkoutState(options)
    const { activeStepIndex, lastCompletedStep } = syncAfterExerciseStructureChange(exercises)
    const sourceTemplateExerciseLineup = sourceTemplateId
      ? snapshotExerciseLineup(exercises)
      : null

    set({
      title,
      startedAt,
      sessionMode,
      emom,
      defaultRestSeconds,
      sourceTemplateId,
      sourceTemplateExerciseLineup,
      exercises,
      activeStepIndex,
      lastCompletedStep,
      ...IDLE_TIMER_STATE,
    })
    await persistDraft(get, {
      title,
      startedAt,
      sessionMode,
      emom,
      defaultRestSeconds,
      sourceTemplateId,
      sourceTemplateExerciseLineup,
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
    const isEmom = get().sessionMode === 'emom'
    const timed = !isEmom && isTimedExercise({
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
        emomGroupId: null,
        targetReps: null,
        targetWeightKg: null,
        defaultRestSeconds,
        sets: isEmom ? [] : [createEmptySet(0, defaultRestSeconds, { timed })],
      },
    ]
    const { activeStepIndex, lastCompletedStep } =
      syncAfterExerciseStructureChange(nextExercises)

    set({ exercises: nextExercises, activeStepIndex, lastCompletedStep })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: get().emom ?? undefined,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
      activeStepIndex,
      lastCompletedStep,
    })
  },

  removeExercise: async (exerciseIndex) => {
    const nextExercises = cleanupExercisesAfterRemoval(
      get().sessionMode,
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

    const compacted = compactExercisesAfterStructureChange(get().sessionMode, exercises)
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

  applySupersetMembership: async (anchorIndex, partnerIndices) => {
    if (get().sessionMode === 'emom') {
      return
    }

    const exercises = mergeSupersetMembership(
      get().exercises,
      anchorIndex,
      partnerIndices,
    )
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
    if (get().sessionMode === 'emom') {
      return
    }

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

  applyEmomGroupMembership: async (anchorIndex, partnerIndices) => {
    if (get().sessionMode !== 'emom') {
      return
    }

    const exercises = mergeEmomGroupMembership(
      get().exercises,
      anchorIndex,
      partnerIndices,
    )

    set({ exercises })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: get().emom,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  removeFromEmomGroup: async (exerciseIndex) => {
    if (get().sessionMode !== 'emom') {
      return
    }

    const exercises = removeExerciseFromEmomGroup(get().exercises, exerciseIndex)

    set({ exercises })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: get().emom,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  updateExerciseTargetReps: async (exerciseIndex, targetReps) => {
    if (get().sessionMode !== 'emom') {
      return
    }

    const exercises = get().exercises.map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, targetReps } : exercise,
    )

    set({ exercises })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: get().emom,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  updateExerciseTargetWeight: async (exerciseIndex, targetWeightKg) => {
    if (get().sessionMode !== 'emom') {
      return
    }

    const exercises = get().exercises.map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, targetWeightKg } : exercise,
    )

    set({ exercises })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: get().emom,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  updatePlannedSet: async (exerciseIndex, setIndex, patch) => {
    if (get().sessionMode === 'emom') {
      return
    }

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
    if (get().sessionMode === 'emom') {
      return
    }

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
    if (get().sessionMode === 'emom') {
      return
    }

    const exercise = get().exercises[exerciseIndex]
    if (!exercise || exercise.sets.length <= 1) {
      return
    }

    const nextSets = exercise.sets.filter((set) => set.setIndex !== setIndex)
    await applyExerciseSetsChange(get, set, exerciseIndex, nextSets)
  },

  reorderPlannedSets: async (exerciseIndex, fromIndex, toIndex) => {
    if (get().sessionMode === 'emom') {
      return
    }

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
    if (get().sessionMode === 'emom') {
      return
    }

    const steps = buildCircuitSteps(get().exercises)
    if (stepIndex < 0 || stepIndex >= steps.length) {
      return
    }

    set({ activeStepIndex: stepIndex, ...clearRestTimerState() })
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
    if (get().sessionMode === 'emom') {
      return
    }

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
        ...clearRestTimerState(),
      })
    } else if (restSeconds > 0) {
      activeStepIndex =
        completedStepIndex >= 0 ? completedStepIndex : get().activeStepIndex
      set({
        exercises,
        lastCompletedStep,
        activeStepIndex,
        ...createRestTimerState(restSeconds),
      })
    } else {
      set({
        exercises,
        lastCompletedStep,
        activeStepIndex,
        ...clearRestTimerState(),
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
    if (get().sessionMode === 'emom') {
      return
    }

    const targetSet = get().exercises[exerciseIndex]?.sets[setIndex]
    if (!targetSet?.completedAt) {
      const holding = get().holdingStep
      if (
        get().isHolding &&
        holding?.exerciseIndex === exerciseIndex &&
        holding?.setIndex === setIndex
      ) {
        set(clearHoldTimerState())
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
      ...IDLE_TIMER_STATE,
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
    if (get().sessionMode === 'emom') {
      return
    }

    set(createRestTimerState(seconds))
  },

  adjustRest: (deltaSeconds) => {
    if (get().sessionMode === 'emom') {
      return
    }

    const state = get()
    if (!state.isResting) {
      return
    }

    const target = Math.max(0, state.restTargetSeconds + deltaSeconds)
    const endsAt = (state.restEndsAt ?? Date.now()) + deltaSeconds * 1_000
    const left = syncRestSecondsLeft(endsAt)

    set({
      restSecondsLeft: left,
      restTargetSeconds: target,
      restEndsAt: endsAt,
    })
  },

  tickRest: () => {
    if (get().sessionMode === 'emom') {
      return
    }

    const state = get()
    if (!state.isResting) {
      return
    }

    const left = syncRestSecondsLeft(state.restEndsAt)
    if (left <= 0) {
      advanceAfterRest(get, set)
      return
    }

    if (left !== state.restSecondsLeft) {
      set({ restSecondsLeft: left })
    }
  },

  skipRest: () => {
    if (get().sessionMode === 'emom') {
      return
    }

    if (!get().isResting) {
      return
    }

    advanceAfterRest(get, set)
  },

  startHold: (exerciseIndex, setIndex) => {
    if (get().sessionMode === 'emom') {
      return
    }

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

    set(createHoldTimerState(targetSet.durationSeconds ?? DEFAULT_HOLD_SECONDS, { exerciseIndex, setIndex }))
  },

  stopHold: async () => {
    if (get().sessionMode === 'emom') {
      return
    }

    if (!get().isHolding || !get().holdingStep) {
      return
    }

    const elapsed = Math.max(
      1,
      get().holdTargetSeconds - syncHoldSecondsLeft(get().holdEndsAt),
    )
    const { exerciseIndex, setIndex } = get().holdingStep

    set(clearHoldTimerState())

    await get().completeStep(exerciseIndex, setIndex, {
      durationSeconds: elapsed,
    })
  },

  tickHold: () => {
    if (get().sessionMode === 'emom') {
      return
    }

    const state = get()
    if (!state.isHolding || !state.holdingStep) {
      return
    }

    const left = syncHoldSecondsLeft(state.holdEndsAt)
    if (left <= 0) {
      void playRestCompleteBeep()
      const { exerciseIndex, setIndex } = state.holdingStep
      const target = state.holdTargetSeconds

      set(clearHoldTimerState())

      void get().completeStep(exerciseIndex, setIndex, {
        durationSeconds: target,
      })
      return
    }

    if (left !== state.holdSecondsLeft) {
      set({ holdSecondsLeft: left })
    }
  },

  tickEmom: () => {
    const emom = get().emom
    if (get().sessionMode !== 'emom' || !emom) {
      return
    }

    const { state: nextEmom, events } = tickEmomState(emom)
    if (nextEmom === emom && events.length === 0) {
      return
    }

    if (events.length > 0) {
      void handleEmomTickEvents(events)
    }

    set({ emom: nextEmom })
    void persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: nextEmom,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: get().exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  logEmomMinute: async (minuteIndex) => {
    const emom = get().emom
    if (get().sessionMode !== 'emom' || !emom) {
      return
    }

    const targetMinute = minuteIndex ?? emom.currentMinuteIndex
    const nextEmom = logEmomMinuteState(emom, targetMinute, new Date().toISOString())

    set({ emom: nextEmom })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: nextEmom,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: get().exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  skipEmomMinute: async () => {
    const emom = get().emom
    if (get().sessionMode !== 'emom' || !emom) {
      return
    }

    const { state: nextEmom, events } = skipToNextMinuteState(emom)
    if (events.length > 0) {
      void handleEmomTickEvents(events)
    }

    set({ emom: nextEmom })
    await persistDraft(get, {
      title: get().title,
      startedAt: get().startedAt,
      sessionMode: get().sessionMode,
      emom: nextEmom,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: get().exercises,
      activeStepIndex: get().activeStepIndex,
      lastCompletedStep: get().lastCompletedStep,
    })
  },

  finishWorkout: async () => {
    const {
      title,
      startedAt,
      sessionMode,
      emom,
      exercises,
      defaultRestSeconds,
      sourceTemplateId,
      sourceTemplateExerciseLineup,
    } = get()
    if (!startedAt) {
      return null
    }

    const draft: ActiveWorkoutDraft = {
      id: 'current',
      title,
      startedAt,
      sessionMode,
      emom: emom ?? undefined,
      defaultRestSeconds,
      sourceTemplateId,
      sourceTemplateExerciseLineup,
      exercises,
    }

    await db.activeDraft.delete('current')
    set({
      title: '',
      startedAt: null,
      sessionMode: DEFAULT_SESSION_MODE,
      emom: null,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      sourceTemplateExerciseLineup: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
      ...IDLE_TIMER_STATE,
    })

    return draft
  },

  cancelWorkout: async () => {
    await db.activeDraft.delete('current')
    set({
      title: '',
      startedAt: null,
      sessionMode: DEFAULT_SESSION_MODE,
      emom: null,
      defaultRestSeconds: 90,
      sourceTemplateId: null,
      sourceTemplateExerciseLineup: null,
      exercises: [],
      activeStepIndex: 0,
      lastCompletedStep: null,
      ...IDLE_TIMER_STATE,
    })
  },
}))
