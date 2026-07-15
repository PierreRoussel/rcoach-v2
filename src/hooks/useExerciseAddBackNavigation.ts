import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { closeTopOverlayLayer } from '@/lib/navigation/close-top-overlay'
import {
  buildExercisePickerReturnNavigationState,
  clearExercisePickerSession,
  getExercisePickerSession,
  shouldDeferTemplateSessionClear,
  type ExercisePickerReturnTo,
} from '@/lib/workout/exercise-picker-session'

const ADD_EXERCISE_PATH = '/app/workout/add-exercise'
export const EXERCISE_ADD_BACK_HISTORY_KEY = '__exerciseAddBack'

export function isExerciseAddPath(pathname: string) {
  return pathname === ADD_EXERCISE_PATH || pathname === `${ADD_EXERCISE_PATH}/`
}

export function isExerciseAddBackTrapState(state: unknown) {
  const historyState = state as { [EXERCISE_ADD_BACK_HISTORY_KEY]?: boolean } | null
  return historyState?.[EXERCISE_ADD_BACK_HISTORY_KEY] === true
}

export function shouldLeaveExerciseAddPageOnPopState(state: unknown) {
  return !isExerciseAddBackTrapState(state)
}

function pushExerciseAddBackTrap() {
  if (isExerciseAddBackTrapState(window.history.state)) {
    return
  }

  window.history.pushState(
    { ...(window.history.state ?? {}), [EXERCISE_ADD_BACK_HISTORY_KEY]: true },
    '',
  )
}

export function navigateExerciseAddBack(
  navigate: (
    options: ExercisePickerReturnTo & { replace?: boolean; state?: unknown },
  ) => void | Promise<void>,
  fallbackReturnTo?: ExercisePickerReturnTo,
) {
  const session = getExercisePickerSession()
  const returnTo = session?.returnTo ?? fallbackReturnTo
  if (!returnTo) {
    return
  }

  const returnNavigationState = buildExercisePickerReturnNavigationState()
  const deferSessionClear = shouldDeferTemplateSessionClear()
  const navigationState =
    returnNavigationState && deferSessionClear
      ? { scrollToExerciseId: returnNavigationState.scrollToExerciseId }
      : returnNavigationState

  void navigate({
    ...returnTo,
    replace: true,
    viewTransition: false,
    ...(navigationState ? { state: navigationState } : {}),
  })

  if (!deferSessionClear) {
    clearExercisePickerSession()
  }
}

export function handleExerciseAddPageBack(
  navigate: (
    options: ExercisePickerReturnTo & { replace?: boolean; state?: unknown },
  ) => void | Promise<void>,
  fallbackReturnTo?: ExercisePickerReturnTo,
) {
  if (closeTopOverlayLayer()) {
    return
  }

  navigateExerciseAddBack(navigate, fallbackReturnTo)
}

export function useExerciseAddBackNavigation() {
  const navigate = useNavigate()
  const handlingBackRef = useRef(false)

  useEffect(() => {
    pushExerciseAddBackTrap()

    const onPopState = (event: PopStateEvent) => {
      if (handlingBackRef.current) {
        return
      }

      if (!shouldLeaveExerciseAddPageOnPopState(event.state)) {
        return
      }

      if (!isExerciseAddPath(window.location.pathname)) {
        return
      }

      handlingBackRef.current = true
      const session = getExercisePickerSession()
      if (session) {
        const returnNavigationState = buildExercisePickerReturnNavigationState()
        const deferSessionClear = shouldDeferTemplateSessionClear()
        const navigationState =
          returnNavigationState && deferSessionClear
            ? { scrollToExerciseId: returnNavigationState.scrollToExerciseId }
            : returnNavigationState

        void navigate({
          ...session.returnTo,
          replace: true,
          viewTransition: false,
          ...(navigationState ? { state: navigationState } : {}),
        } as Parameters<typeof navigate>[0]).finally(() => {
          handlingBackRef.current = false
        })

        if (!deferSessionClear) {
          clearExercisePickerSession()
        }
      } else {
        handlingBackRef.current = false
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [navigate])
}

export function cancelExerciseAddNavigation(
  navigate: (
    options: ExercisePickerReturnTo & { replace?: boolean; state?: unknown },
  ) => void | Promise<void>,
  fallbackReturnTo?: ExercisePickerReturnTo,
) {
  navigateExerciseAddBack(navigate, fallbackReturnTo)
}
