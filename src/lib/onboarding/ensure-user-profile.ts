import type { NhostClient } from '@nhost/nhost-js'

import { ENSURE_USER_PROFILE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { fetchMyProfile } from '@/lib/graphql/profile-request'

const PROFILE_RETRY_DELAYS_MS = [0, 400, 900, 1500] as const

function isEnsureUserProfileMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('ensure_user_profile') &&
    (message.includes('query_root') || message.includes('not found'))
  )
}

async function createUserProfileViaRpc(nhost: NhostClient, userId: string) {
  try {
    const data = await graphqlRequest<{ ensure_user_profile: string }>(
      nhost,
      ENSURE_USER_PROFILE,
    )
    return data.ensure_user_profile
  } catch (error) {
    if (isEnsureUserProfileMissingError(error)) {
      return null
    }

    throw error
  }
}

/** Waits briefly, then provisions the profile row on first authenticated session (idempotent). */
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

  const createdProfileId = await createUserProfileViaRpc(nhost, userId)
  if (createdProfileId) {
    return createdProfileId
  }

  const profile = await fetchMyProfile(nhost, userId)
  if (profile?.id) {
    return profile.id
  }

  throw new Error(
    'Profil introuvable. Réessayez dans quelques secondes ou reconnectez-vous.',
  )
}
