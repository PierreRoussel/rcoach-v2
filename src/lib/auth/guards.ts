import { redirect } from '@tanstack/react-router'

import { fetchMyProfile } from '@/lib/graphql/profile-request'
import { nhost } from '@/lib/nhost/AuthProvider'

export function requireAuth() {
  if (!nhost.getUserSession()) {
    throw redirect({ to: '/auth/login' })
  }
}

export function redirectIfAuthenticated() {
  if (nhost.getUserSession()) {
    throw redirect({ to: '/app' })
  }
}

export async function resolveDefaultAuthenticatedPath(): Promise<'/app' | '/app/onboarding'> {
  const session = nhost.getUserSession()
  const userId = session?.user?.id

  if (!userId) {
    return '/app/onboarding'
  }

  try {
    const profile = await fetchMyProfile(nhost, userId)
    return isAppOnboardingComplete(profile) ? '/app' : '/app/onboarding'
  } catch {
    // Avoid locking out returning users when profile fetch fails transiently.
    return '/app'
  }
}

export function isAppOnboardingComplete(
  profile: { onboarding_completed_at?: string | null } | null | undefined,
) {
  return Boolean(profile?.onboarding_completed_at)
}

function isRouterRedirect(error: unknown) {
  return (
    typeof error === 'object' &&
    error != null &&
    'isRedirect' in error &&
    (error as { isRedirect?: boolean }).isRedirect === true
  )
}

export async function requireAppOnboardingComplete() {
  const session = nhost.getUserSession()
  const userId = session?.user?.id

  if (!userId) {
    return
  }

  try {
    const profile = await fetchMyProfile(nhost, userId)

    if (!isAppOnboardingComplete(profile)) {
      throw redirect({ to: '/app/onboarding' })
    }
  } catch (error) {
    if (isRouterRedirect(error)) {
      throw error
    }
  }
}

export async function redirectIfAppOnboardingComplete() {
  const session = nhost.getUserSession()
  const userId = session?.user?.id

  if (!userId) {
    return
  }

  try {
    const profile = await fetchMyProfile(nhost, userId)

    if (isAppOnboardingComplete(profile)) {
      throw redirect({ to: '/app' })
    }
  } catch (error) {
    if (isRouterRedirect(error)) {
      throw error
    }

    // GraphQL unavailable or profile missing — stay on onboarding instead of blocking auth.
  }
}
