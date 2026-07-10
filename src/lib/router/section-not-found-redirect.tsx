import { Navigate } from '@tanstack/react-router'

type SectionHome = '/' | '/app' | '/coach'

export function createSectionNotFoundRedirect(to: SectionHome) {
  return function SectionNotFoundRedirect() {
    return <Navigate to={to} replace />
  }
}

export function RootNotFoundRedirect() {
  const to: SectionHome =
    import.meta.env.VITE_BUILD_TARGET === 'android' ? '/app' : '/'

  return <Navigate to={to} replace />
}
