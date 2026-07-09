import { redirect } from '@tanstack/react-router'

import { bootstrapAuthUserLocaleIfNeeded } from '@/lib/auth/auth-user-locale'
import { fetchMyProfile } from '@/lib/graphql/profile-request'
import { ensureUserProfile } from '@/lib/onboarding/ensure-user-profile'
import { isAdminProfile } from '@/lib/profile/roles'
import { nhost } from '@/lib/nhost/AuthProvider'

export function requireAuth() {
  if (!nhost.getUserSession()) {
    throw redirect({ to: '/auth/login' })
  }
}

/** Creates public.profiles on first authenticated session (idempotent). */
export async function ensureAuthenticatedProfile() {
  const userId = nhost.getUserSession()?.user?.id
  if (!userId) {
    return
  }

  await ensureUserProfile(nhost, userId)
  await bootstrapAuthUserLocaleIfNeeded(nhost, userId)
}

export async function requireAuthenticatedUser() {
  requireAuth()
  await ensureAuthenticatedProfile()
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

export async function requireAdmin() {
  const session = nhost.getUserSession()
  const userId = session?.user?.id

  if (!userId) {
    throw redirect({ to: '/auth/login' })
  }

  try {
    const profile = await fetchMyProfile(nhost, userId)

    if (!isAdminProfile(profile)) {
      throw redirect({ to: '/coach' })
    }
  } catch (error) {
    if (isRouterRedirect(error)) {
      throw error
    }

    throw redirect({ to: '/coach' })
  }
}

export { isAdminProfile } from '@/lib/profile/roles'
