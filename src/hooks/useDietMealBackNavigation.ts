import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { closeTopOverlayLayer } from '@/lib/navigation/close-top-overlay'
import type { MealType } from '@/lib/nutrition/types'

const MEAL_PATH_PREFIX = '/app/diet/meals/'
const ADD_PATH = '/app/diet/add'
export const MEAL_BACK_HISTORY_KEY = '__dietMealBack'
export const ADD_BACK_HISTORY_KEY = '__dietAddBack'

export function isDietMealPath(pathname: string) {
  return pathname.startsWith(MEAL_PATH_PREFIX)
}

export function isDietAddPath(pathname: string) {
  return pathname === ADD_PATH || pathname === `${ADD_PATH}/`
}

export function isMealBackTrapState(state: unknown) {
  const historyState = state as { [MEAL_BACK_HISTORY_KEY]?: boolean } | null
  return historyState?.[MEAL_BACK_HISTORY_KEY] === true
}

export function isAddBackTrapState(state: unknown) {
  const historyState = state as { [ADD_BACK_HISTORY_KEY]?: boolean } | null
  return historyState?.[ADD_BACK_HISTORY_KEY] === true
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

export function shouldLeaveAddPageOnPopState(state: unknown) {
  return !isAddBackTrapState(state)
}

type MealPageBackNavigate = (options: {
  to: '/app/diet'
  search: { date: string }
  replace: true
}) => void | Promise<void>

function pushMealBackTrap() {
  if (isMealBackTrapState(window.history.state)) {
    return
  }

  window.history.pushState(
    { ...(window.history.state ?? {}), [MEAL_BACK_HISTORY_KEY]: true },
    '',
  )
}

function pushAddBackTrap() {
  if (isAddBackTrapState(window.history.state)) {
    return
  }

  window.history.pushState(
    { ...(window.history.state ?? {}), [ADD_BACK_HISTORY_KEY]: true },
    '',
  )
}

/** Aligns hardware/browser back with the meal history trap + popstate handler. */
export function handleMealPageBack(navigate: MealPageBackNavigate, date: string) {
  if (hasOverlayHistoryState(window.history.state)) {
    if (closeTopOverlayLayer()) {
      return
    }
  }

  void navigate({
    to: '/app/diet',
    search: { date },
    replace: true,
  })
}

type AddPageBackNavigate = (options: {
  to: '/app/diet/meals/$mealType'
  params: { mealType: MealType }
  search: { date: string }
  replace: true
}) => void | Promise<void>

/** Hardware/browser back from food add always returns to the meal detail page. */
export function handleAddPageBack(
  navigate: AddPageBackNavigate,
  date: string,
  mealType: MealType,
) {
  if (hasOverlayHistoryState(window.history.state)) {
    if (closeTopOverlayLayer()) {
      return
    }
  }

  void navigate({
    to: '/app/diet/meals/$mealType',
    params: { mealType },
    search: { date },
    replace: true,
  })
}

/** Browser back from a meal detail page always returns to the diet journal. */
export function useDietMealBackNavigation(date: string) {
  const navigate = useNavigate()
  const handlingBackRef = useRef(false)

  useEffect(() => {
    pushMealBackTrap()

    const onPopState = (event: PopStateEvent) => {
      if (handlingBackRef.current) {
        return
      }

      if (!shouldLeaveMealPageOnPopState(event.state)) {
        return
      }

      if (hasOverlayHistoryState(event.state)) {
        return
      }

      if (!isDietMealPath(window.location.pathname)) {
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

/** Browser back from food add always returns to the matching meal detail page. */
export function useDietAddBackNavigation(date: string, mealType: MealType) {
  const navigate = useNavigate()
  const handlingBackRef = useRef(false)

  useEffect(() => {
    pushAddBackTrap()

    const onPopState = (event: PopStateEvent) => {
      if (handlingBackRef.current) {
        return
      }

      if (!shouldLeaveAddPageOnPopState(event.state)) {
        return
      }

      if (hasOverlayHistoryState(event.state)) {
        return
      }

      if (!isDietAddPath(window.location.pathname)) {
        return
      }

      handlingBackRef.current = true
      void navigate({
        to: '/app/diet/meals/$mealType',
        params: { mealType },
        search: { date },
        replace: true,
      }).finally(() => {
        handlingBackRef.current = false
      })
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [date, mealType, navigate])
}
