import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

function closeTopLayer() {
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
  const canGoBackRef = useRef(canGoBack)

  useEffect(() => {
    canGoBackRef.current = canGoBack
  }, [canGoBack])

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return
    }

    const listenerPromise = App.addListener('backButton', () => {
      if (closeTopLayer()) {
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
