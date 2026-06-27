import type { NhostClient } from '@nhost/nhost-js'

import { fetchMyProfile } from '@/lib/graphql/profile-request'

const PROFILE_RETRY_DELAYS_MS = [0, 400, 900, 1500] as const

export async function ensureUserProfile(
  nhost: NhostClient,
  userId: string,
): Promise<string> {
  for (const delayMs of PROFILE_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs)
      })
    }

    try {
      const profile = await fetchMyProfile(nhost, userId)
      if (profile?.id) {
        return profile.id
      }
    } catch {
      // Retry while signup trigger or API catches up.
    }
  }

  throw new Error(
    'Profil introuvable. Réessayez dans quelques secondes ou reconnectez-vous.',
  )
}
