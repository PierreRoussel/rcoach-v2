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
  scrollTargetExerciseId: string | null
}

let state: ExercisePickerState = {
  session: null,
  pendingAdds: [],
  completedResult: null,
  scrollTargetExerciseId: null,
}

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
    scrollTargetExerciseId: null,
  }
}

export function markExercisePickerScrollTarget(exerciseId: string) {
  if (!state.session) {
    return
  }

  state = {
    ...state,
    scrollTargetExerciseId: exerciseId,
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

export function buildExercisePickerReturnNavigationState():
  | ExercisePickerNavigationState
  | undefined {
  if (!state.session || state.session.mode !== 'add') {
    return undefined
  }

  const scrollToExerciseId =
    state.scrollTargetExerciseId ??
    state.pendingAdds[state.pendingAdds.length - 1]?.id

  if (state.session.context === 'template' && state.pendingAdds.length > 0) {
    return {
      exercisePickerAdds: [...state.pendingAdds],
      scrollToExerciseId,
    }
  }

  if (
    (state.session.context === 'active' || state.session.context === 'replace') &&
    scrollToExerciseId
  ) {
    return { scrollToExerciseId }
  }

  return undefined
}

export type ExercisePickerNavigationState = {
  exercisePickerAdds?: Exercise[]
  scrollToExerciseId?: string
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

export function shouldKeepTemplateAddSessionForConsumer() {
  return (
    state.session?.context === 'template' &&
    state.session.mode === 'add' &&
    state.pendingAdds.length > 0
  )
}

export function shouldDeferTemplateSessionClear() {
  if (state.session?.context !== 'template') {
    return false
  }

  return state.pendingAdds.length > 0 || state.completedResult != null
}

export function peekExercisePickerScrollTarget() {
  return state.scrollTargetExerciseId
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
