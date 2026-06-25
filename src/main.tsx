import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AuthQuerySync } from '@/components/auth/AuthQuerySync'
import { ThemeProvider } from '@/design-system'
import { AuthProvider } from '@/lib/nhost/AuthProvider'
import { resolveViewTransitionTypes } from '@/lib/router/view-transition-types'
import { routeTree } from '@/routeTree.gen'

import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

const router = createRouter({
  routeTree,
  context: {},
  defaultViewTransition: {
    types: ({ fromLocation, toLocation }) =>
      resolveViewTransitionTypes(fromLocation?.pathname, toLocation.pathname),
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AuthQuerySync />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
