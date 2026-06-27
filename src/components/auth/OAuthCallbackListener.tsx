import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

function isOAuthVerifyPath(pathname: string) {
  return pathname === '/auth/verify' || pathname.endsWith('/auth/verify')
}

function parseOAuthCallbackUrl(url: string) {
  const parsed = new URL(url)
  if (!isOAuthVerifyPath(parsed.pathname)) {
    return null
  }

  return {
    code: parsed.searchParams.get('code') ?? undefined,
    error: parsed.searchParams.get('error') ?? undefined,
    errorDescription: parsed.searchParams.get('error_description') ?? undefined,
  }
}

export function OAuthCallbackListener() {
  const router = useRouter()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    let active = true

    const handleCallbackUrl = async (url: string) => {
      const callback = parseOAuthCallbackUrl(url)
      if (!callback) {
        return
      }

      try {
        await Browser.close()
      } catch {
        // Browser may already be closed.
      }

      await router.navigate({
        to: '/auth/verify',
        search: {
          code: callback.code,
          error: callback.error,
          errorDescription: callback.errorDescription,
        },
      })
    }

    const listenerPromise = App.addListener('appUrlOpen', ({ url }) => {
      void handleCallbackUrl(url)
    })

    void App.getLaunchUrl().then((launchUrl) => {
      if (!active || !launchUrl?.url) {
        return
      }

      void handleCallbackUrl(launchUrl.url)
    })

    return () => {
      active = false
      void listenerPromise.then((listener) => listener.remove())
    }
  }, [router])

  return null
}
