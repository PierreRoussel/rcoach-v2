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

let templateRemountPendingAdds: Exercise[] = []

export function getExercisePickerSession() {
  return state.session
}

export function openExercisePicker(session: ExercisePickerSession) {
  const mode = session.mode ?? 'add'

  state = {
    session: {
      ...session,
      mode,
      replaceIndex: mode === 'replace' ? session.replaceIndex : undefined,
    },
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

  if (outcome.pendingAdds.length > 0) {
    templateRemountPendingAdds = outcome.pendingAdds
  }

  clearExercisePickerSession()
  return outcome
}

export function takeTemplateRemountPendingAdds() {
  const pending = templateRemountPendingAdds
  templateRemountPendingAdds = []
  return pending
}

export function peekExercisePickerExcludeIds() {
  return state.session?.excludeIds ?? []
}

export function peekExercisePickerPendingAdds() {
  return [...state.pendingAdds]
}

export function hasExercisePickerPendingWork() {
  return state.pendingAdds.length > 0 || state.completedResult != null
}

function normalizePathname(pathname: string) {
  return pathname.replace(/\/$/, '') || '/'
}

export function resolveExercisePickerReturnPathname(returnTo: ExercisePickerReturnTo): string {
  let path = returnTo.to

  if (returnTo.params) {
    for (const [key, value] of Object.entries(returnTo.params)) {
      path = path.replace(`$${key}`, value)
    }
  }

  return normalizePathname(path)
}

export function isExercisePickerReturnLocation(
  pathname: string,
  returnTo: ExercisePickerReturnTo,
): boolean {
  return normalizePathname(pathname) === resolveExercisePickerReturnPathname(returnTo)
}
