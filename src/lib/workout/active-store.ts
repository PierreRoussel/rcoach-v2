import { create } from 'zustand'

import { db, type ActiveWorkoutDraft } from '@/lib/db/dexie'

type ActiveSet = ActiveWorkoutDraft['exercises'][number]['sets'][number]

type ActiveExercise = ActiveWorkoutDraft['exercises'][number]

type ActiveWorkoutState = {
  title: string
  startedAt: string | null
  exercises: ActiveExercise[]
  restSecondsLeft: number
  isResting: boolean
  hydrate: () => Promise<void>
  startWorkout: (title: string) => Promise<void>
  addExercise: (exercise: { id: string; name: string }) => Promise<void>
  addSet: (exerciseIndex: number, set: Omit<ActiveSet, 'setIndex'>) => Promise<void>
  startRest: (seconds: number) => void
  tickRest: () => void
  finishWorkout: () => Promise<ActiveWorkoutDraft | null>
  cancelWorkout: () => Promise<void>
}

async function persistDraft(state: Pick<ActiveWorkoutState, 'title' | 'startedAt' | 'exercises'>) {
  if (!state.startedAt) {
    return
  }

  await db.activeDraft.put({
    id: 'current',
    title: state.title,
    startedAt: state.startedAt,
    exercises: state.exercises,
  })
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
  title: '',
  startedAt: null,
  exercises: [],
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
      exercises: draft.exercises,
    })
  },

  startWorkout: async (title) => {
    const startedAt = new Date().toISOString()
    set({ title, startedAt, exercises: [], restSecondsLeft: 0, isResting: false })
    await persistDraft({ title, startedAt, exercises: [] })
  },

  addExercise: async (exercise) => {
    const nextExercises = [
      ...get().exercises,
      { exerciseId: exercise.id, exerciseName: exercise.name, sets: [] },
    ]
    set({ exercises: nextExercises })
    await persistDraft({
      title: get().title,
      startedAt: get().startedAt,
      exercises: nextExercises,
    })
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
      exercises: [],
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
      exercises: [],
      restSecondsLeft: 0,
      isResting: false,
    })
  },
}))
