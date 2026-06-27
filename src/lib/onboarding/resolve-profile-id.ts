import type { NhostClient } from '@nhost/nhost-js'

import { fetchMyProfile } from '@/lib/graphql/profile-request'

const PROFILE_RETRY_DELAYS_MS = [0, 400, 900] as const

export async function resolveOnboardingProfileId(
  nhost: NhostClient,
  userId: string | undefined,
  cachedProfileId?: string | null,
): Promise<string> {
  if (cachedProfileId) {
    return cachedProfileId
  }

  if (!userId) {
    throw new Error('Utilisateur non connecté.')
  }

  for (const delayMs of PROFILE_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs)
      })
    }

    const profile = await fetchMyProfile(nhost, userId)
    if (profile?.id) {
      return profile.id
    }
  }

  // profiles.id is always the auth user id (FK + trigger on signup)
  return userId
}
