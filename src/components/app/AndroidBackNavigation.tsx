import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useCanGoBack, useRouter, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { handleMealPageBack, isDietMealPath } from '@/hooks/useDietMealBackNavigation'
import { toDateKey } from '@/lib/nutrition/dates'

function isDietJournalPath(pathname: string) {
  return pathname === '/app/diet' || pathname === '/app/diet/'
}

function resolveDietDate(search: unknown) {
  return typeof search === 'object' && search && 'date' in search && typeof search.date === 'string'
    ? search.date
    : toDateKey(new Date())
}

function closeTopLayer() {
  const openDrawer = document.querySelector('[data-vaul-drawer][data-state="open"]')
  if (openDrawer) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    return true
  }

  const openDialog = document.querySelector('[role="dialog"][data-state="open"]')
  if (openDialog) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    return true
  }

  const openMenu = document.querySelector('[role="menu"][data-state="open"]')
  if (openMenu) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    return true
  }

  return false
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
      if (closeTopLayer()) {
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
