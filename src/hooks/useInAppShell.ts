import { useRouterState } from '@tanstack/react-router'

export function useInAppShell() {
  return useRouterState({
    select: (state) => state.location.pathname.startsWith('/app'),
  })
}
