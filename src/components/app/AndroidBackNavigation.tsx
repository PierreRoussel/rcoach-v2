import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useCanGoBack, useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { handleMealPageBack, isDietMealPath } from '@/hooks/useDietMealBackNavigation'
import { closeTopOverlayLayer } from '@/lib/navigation/close-top-overlay'
import { toDateKey } from '@/lib/nutrition/dates'

function isDietJournalPath(pathname: string) {
  return pathname === '/app/diet' || pathname === '/app/diet/'
}

function resolveDietDate(search: unknown) {
  return typeof search === 'object' && search && 'date' in search && typeof search.date === 'string'
    ? search.date
    : toDateKey(new Date())
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

      const { pathname, search } = locationRef.current

      if (isDietMealPath(pathname)) {
        handleMealPageBack(
          (options) => router.navigate(options),
          resolveDietDate(search),
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
