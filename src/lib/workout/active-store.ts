import { create } from 'zustand'

import { db, type ActiveWorkoutDraft } from '@/lib/db/dexie'

type ActiveSet = ActiveWorkoutDraft['exercises'][number]['sets'][number]

export type ActiveExerciseEntry = ActiveWorkoutDraft['exercises'][number]

type ActiveWorkoutState = {
  title: string
  startedAt: string | null
  defaultRestSeconds: number
  exercises: ActiveExerciseEntry[]
  activeExerciseIndex: number
  restSecondsLeft: number
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
  setActiveExerciseIndex: (index: number) => void
  addSet: (exerciseIndex: number, set: Omit<ActiveSet, 'setIndex'>) => Promise<void>
  startRest: (seconds: number) => void
  tickRest: () => void
  skipRest: () => void
  finishWorkout: () => Promise<ActiveWorkoutDraft | null>
  cancelWorkout: () => Promise<void>
}

async function persistDraft(
  state: Pick<ActiveWorkoutState, 'title' | 'startedAt' | 'exercises' | 'defaultRestSeconds'>,
) {
  if (!state.startedAt) {
    return
  }

  await db.activeDraft.put({
    id: 'current',
    title: state.title,
    startedAt: state.startedAt,
    defaultRestSeconds: state.defaultRestSeconds,
    exercises: state.exercises,
  })
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  title: '',
  startedAt: null,
  defaultRestSeconds: 90,
  exercises: [],
  activeExerciseIndex: 0,
  restSecondsLeft: 0,
  isResting: false,

  hydrate: async () => {
    const draft = await db.activeDraft.get('current')
    if (!draft) {
      return
    }

    set({
      title: draft.title,
      startedAt: draft.startedAt,
      defaultRestSeconds: draft.defaultRestSeconds ?? 90,
      exercises: draft.exercises,
      activeExerciseIndex: 0,
    })
  },

  startWorkout: async (title) => {
    const startedAt = new Date().toISOString()
    set({
      title,
      startedAt,
      defaultRestSeconds: 90,
      exercises: [],
      activeExerciseIndex: 0,
      restSecondsLeft: 0,
      isResting: false,
    })
    await persistDraft({ title, startedAt, defaultRestSeconds: 90, exercises: [] })
  },

  startWorkoutFromTemplate: async (title, exercises, defaultRestSeconds = 90) => {
    const startedAt = new Date().toISOString()

    set({
      title,
      startedAt,
      defaultRestSeconds,
      exercises,
      activeExerciseIndex: 0,
      restSecondsLeft: 0,
      isResting: false,
    })
    await persistDraft({ title, startedAt, defaultRestSeconds, exercises })
  },

  addExercise: async (exercise) => {
    if (get().exercises.some((item) => item.exerciseId === exercise.id)) {
      return
    }

    const nextExercises = [
      ...get().exercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscle_group ?? null,
        equipment: exercise.equipment ?? null,
        sets: [],
      },
    ]

    set({
      exercises: nextExercises,
      activeExerciseIndex: nextExercises.length - 1,
    })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
    })
  },

  removeExercise: async (exerciseIndex) => {
    const nextExercises = get().exercises.filter((_, index) => index !== exerciseIndex)
    const nextActive = Math.min(get().activeExerciseIndex, Math.max(nextExercises.length - 1, 0))
    set({ exercises: nextExercises, activeExerciseIndex: nextActive })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises: nextExercises,
    })
  },

  reorderExercises: async (fromIndex, toIndex) => {
    const exercises = [...get().exercises]
    const [moved] = exercises.splice(fromIndex, 1)
    if (!moved) {
      return
    }
    exercises.splice(toIndex, 0, moved)

    let activeExerciseIndex = get().activeExerciseIndex
    if (activeExerciseIndex === fromIndex) {
      activeExerciseIndex = toIndex
    } else if (fromIndex < activeExerciseIndex && toIndex >= activeExerciseIndex) {
      activeExerciseIndex -= 1
    } else if (fromIndex > activeExerciseIndex && toIndex <= activeExerciseIndex) {
      activeExerciseIndex += 1
    }

    set({ exercises, activeExerciseIndex })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      defaultRestSeconds: get().defaultRestSeconds,
      exercises,
    })
  },

  setActiveExerciseIndex: (index) => {
    set({ activeExerciseIndex: index })
  },

  addSet: async (exerciseIndex, setInput) => {
    const exercises = get().exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return exercise
      }

      return {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            ...setInput,
            setIndex: exercise.sets.length,
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
    })
  },

  startRest: (seconds) => {
    set({ isResting: true, restSecondsLeft: seconds })
  },

  tickRest: () => {
    const next = get().restSecondsLeft - 1
    if (next <= 0) {
      set({ isResting: false, restSecondsLeft: 0 })
      return
    }

    set({ restSecondsLeft: next })
  },

  skipRest: () => {
    set({ isResting: false, restSecondsLeft: 0 })
  },

  finishWorkout: async () => {
    const { title, startedAt, exercises } = get()
    if (!startedAt) {
      return null
    }

    const draft: ActiveWorkoutDraft = {
      id: 'current',
      title,
      startedAt,
      exercises,
    }

    await db.activeDraft.delete('current')
    set({
      title: '',
      startedAt: null,
      defaultRestSeconds: 90,
      exercises: [],
      activeExerciseIndex: 0,
      restSecondsLeft: 0,
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
      activeExerciseIndex: 0,
      restSecondsLeft: 0,
      isResting: false,
    })
  },
}))
