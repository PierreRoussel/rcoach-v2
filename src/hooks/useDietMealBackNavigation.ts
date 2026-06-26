import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

const MEAL_PATH_PREFIX = '/app/diet/meals/'
export const MEAL_BACK_HISTORY_KEY = '__dietMealBack'

export function isDietMealPath(pathname: string) {
  return pathname.startsWith(MEAL_PATH_PREFIX)
}

export function isMealBackTrapState(state: unknown) {
  const historyState = state as { [MEAL_BACK_HISTORY_KEY]?: boolean } | null
  return historyState?.[MEAL_BACK_HISTORY_KEY] === true
}

export function hasOverlayHistoryState(state: unknown) {
  if (state == null || typeof state !== 'object') {
    return false
  }

  return Object.entries(state as Record<string, unknown>).some(
    ([key, value]) => key.startsWith('overlay-') && value === true,
  )
}

export function shouldLeaveMealPageOnPopState(state: unknown) {
  return !isMealBackTrapState(state)
}

type MealPageBackNavigate = (options: {
  to: '/app/diet'
  search: { date: string }
  replace: true
}) => void | Promise<void>

/** Aligns hardware/browser back with the meal history trap + popstate handler. */
export function handleMealPageBack(navigate: MealPageBackNavigate, date: string) {
  const state = window.history.state

  if (hasOverlayHistoryState(state) || isMealBackTrapState(state)) {
    window.history.back()
    return
  }

  void navigate({
    to: '/app/diet',
    search: { date },
    replace: true,
  })
}

/** Browser back from a meal detail page always returns to the diet journal. */
export function useDietMealBackNavigation(date: string) {
  const navigate = useNavigate()
  const handlingBackRef = useRef(false)

  useEffect(() => {
    window.history.pushState({ [MEAL_BACK_HISTORY_KEY]: true }, '')

    const onPopState = (event: PopStateEvent) => {
      if (handlingBackRef.current || !shouldLeaveMealPageOnPopState(event.state)) {
        return
      }

      handlingBackRef.current = true
      void navigate({
        to: '/app/diet',
        search: { date },
        replace: true,
      }).finally(() => {
        handlingBackRef.current = false
      })
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [date, navigate])
}
