import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'

import { ThemeProvider } from '@/design-system'
import { AuthProvider } from '@/lib/nhost/AuthProvider'
import { queryClient } from '@/lib/query-client'
import { resolveViewTransitionTypes } from '@/lib/router/view-transition-types'
import { installViewTransitionErrorGuard } from '@/lib/router/view-transition-guard'
import { routeTree as routeTreeAndroid } from '@/routeTree.android.gen'
import { routeTree as routeTreeWeb } from '@/routeTree.gen'

const routeTree = (
  import.meta.env.VITE_BUILD_TARGET === 'android' ? routeTreeAndroid : routeTreeWeb
) as typeof routeTreeWeb

import './index.css'

const isAndroidShell = import.meta.env.VITE_BUILD_TARGET === 'android'

if (!isAndroidShell) {
  installViewTransitionErrorGuard()
}

const router = createRouter({
  routeTree,
  context: {},
  // View Transitions API leaves Android WebView stuck on a black frame at boot.
  ...(isAndroidShell
    ? {}
    : {
        defaultViewTransition: {
          types: ({ fromLocation, toLocation }) =>
            resolveViewTransitionTypes(fromLocation?.pathname, toLocation.pathname),
        },
      }),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
