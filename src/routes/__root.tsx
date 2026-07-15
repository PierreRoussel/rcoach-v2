import { Capacitor } from '@capacitor/core'
import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'

import { AndroidBackNavigation } from '@/components/app/AndroidBackNavigation'
import { NativeSafeAreaSetup } from '@/components/app/NativeSafeAreaSetup'
import { OAuthCallbackListener } from '@/components/auth/OAuthCallbackListener'
import { RootNotFoundRedirect } from '@/lib/router/section-not-found-redirect'

function RootLayout() {
  return (
    <div className="min-h-svh bg-background font-body text-foreground">
      <NativeSafeAreaSetup />
      <AndroidBackNavigation />
      <OAuthCallbackListener />
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (
      Capacitor.isNativePlatform() &&
      (location.pathname === '/' || location.pathname === '/index.html')
    ) {
      throw redirect({ to: '/app', replace: true })
    }
  },
  component: RootLayout,
  notFoundComponent: RootNotFoundRedirect,
})
