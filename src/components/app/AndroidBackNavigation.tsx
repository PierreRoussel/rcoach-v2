import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useCanGoBack, useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import {
  handleAddPageBack,
  handleMealPageBack,
  isDietAddPath,
  isDietMealPath,
} from '@/hooks/useDietMealBackNavigation'
import { closeTopOverlayLayer } from '@/lib/navigation/close-top-overlay'
import { closeTopHistoryOverlay } from '@/hooks/useOverlayBackClose'
import { toDateKey } from '@/lib/nutrition/dates'
import type { MealType } from '@/lib/nutrition/types'

function isDietJournalPath(pathname: string) {
  return pathname === '/app/diet' || pathname === '/app/diet/'
}

function resolveDietDate(search: unknown) {
  return typeof search === 'object' && search && 'date' in search && typeof search.date === 'string'
    ? search.date
    : toDateKey(new Date())
}

function resolveMealType(search: unknown): MealType {
  const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'] as const

  if (
    typeof search === 'object' &&
    search &&
    'mealType' in search &&
    typeof search.mealType === 'string' &&
    mealTypes.includes(search.mealType as MealType)
  ) {
    return search.mealType as MealType
  }

  return 'breakfast'
}

export function AndroidBackNavigation() {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const location = useRouterState({ select: (state) => state.location })
  const canGoBackRef = useRef(canGoBack)
  const locationRef = useRef(location)

  useEffect(() => {
    canGoBackRef.current = canGoBack
  }, [canGoBack])

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return
    }

    const listenerPromise = App.addListener('backButton', () => {
      if (closeTopOverlayLayer()) {
        return
      }

      if (closeTopHistoryOverlay()) {
        return
      }

      const { pathname, search } = locationRef.current

      if (isDietMealPath(pathname)) {
        handleMealPageBack(
          (options) => router.navigate(options),
          resolveDietDate(search),
        )
        return
      }

      if (isDietAddPath(pathname)) {
        handleAddPageBack(
          (options) => router.navigate(options),
          resolveDietDate(search),
          resolveMealType(search),
        )
        return
      }

      if (isDietJournalPath(pathname) || pathname.startsWith('/app/diet/')) {
        void router.navigate({ to: '/app' })
        return
      }

      if (canGoBackRef.current) {
        router.history.back()
        return
      }

      void App.exitApp()
    })

    return () => {
      void listenerPromise.then((listener) => listener.remove())
    }
  }, [router])

  return null
}
