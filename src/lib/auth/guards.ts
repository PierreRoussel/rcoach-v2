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

export function isAppOnboardingComplete(
  profile: { onboarding_completed_at?: string | null } | null | undefined,
) {
  return Boolean(profile?.onboarding_completed_at)
}

export async function requireAppOnboardingComplete() {
  const session = nhost.getUserSession()
  const userId = session?.user?.id

  if (!userId) {
    return
  }

  const profile = await fetchMyProfile(nhost, userId)

  if (!isAppOnboardingComplete(profile)) {
    throw redirect({ to: '/app/onboarding' })
  }
}

export async function redirectIfAppOnboardingComplete() {
  const session = nhost.getUserSession()
  const userId = session?.user?.id

  if (!userId) {
    return
  }

  const profile = await fetchMyProfile(nhost, userId)

  if (isAppOnboardingComplete(profile)) {
    throw redirect({ to: '/app' })
  }
}
