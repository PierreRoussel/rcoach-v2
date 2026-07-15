import type { Exercise } from '@/lib/graphql/operations'

export type ExercisePickerContext = 'active' | 'template' | 'program' | 'replace'

export type ExercisePickerReturnTo = {
  to: string
  params?: Record<string, string>
  search?: Record<string, unknown>
}

export type ExercisePickerSession = {
  excludeIds: string[]
  mode: 'add' | 'replace'
  replaceIndex?: number
  context: ExercisePickerContext
  returnTo: ExercisePickerReturnTo
  programId?: string
  programDayId?: string
  templateId?: string
}

export type ExercisePickerResult = {
  exercise: Exercise
  mode: 'add' | 'replace'
  replaceIndex?: number
}

type ExercisePickerState = {
  session: ExercisePickerSession | null
  pendingAdds: Exercise[]
  completedResult: ExercisePickerResult | null
}

let state: ExercisePickerState = {
  session: null,
  pendingAdds: [],
  completedResult: null,
}

export function getExercisePickerSession() {
  return state.session
}

export function openExercisePicker(session: ExercisePickerSession) {
  state = {
    session,
    pendingAdds: [],
    completedResult: null,
  }
}

export function clearExercisePickerSession() {
  state = {
    session: null,
    pendingAdds: [],
    completedResult: null,
  }
}

export function addPendingExercise(exercise: Exercise) {
  if (!state.session) {
    return
  }

  if (state.session.excludeIds.includes(exercise.id)) {
    return
  }

  state = {
    ...state,
    session: {
      ...state.session,
      excludeIds: [...state.session.excludeIds, exercise.id],
    },
    pendingAdds: [...state.pendingAdds, exercise],
  }
}

export function excludeExerciseFromPicker(exerciseId: string) {
  if (!state.session || state.session.excludeIds.includes(exerciseId)) {
    return
  }

  state = {
    ...state,
    session: {
      ...state.session,
      excludeIds: [...state.session.excludeIds, exerciseId],
    },
  }
}

export function completeExercisePicker(result: ExercisePickerResult) {
  state = {
    ...state,
    completedResult: result,
  }
}

export type ExercisePickerOutcome = {
  session: ExercisePickerSession
  pendingAdds: Exercise[]
  completedResult: ExercisePickerResult | null
}

export function consumeExercisePickerOutcome(): ExercisePickerOutcome | null {
  if (!state.session) {
    return null
  }

  const outcome: ExercisePickerOutcome = {
    session: state.session,
    pendingAdds: [...state.pendingAdds],
    completedResult: state.completedResult,
  }

  clearExercisePickerSession()
  return outcome
}

export function peekExercisePickerExcludeIds() {
  return state.session?.excludeIds ?? []
}
