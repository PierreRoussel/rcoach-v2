import type { NhostClient } from '@nhost/nhost-js'

import { ENSURE_USER_PROFILE } from '@/lib/graphql/operations'
import { fetchMyProfile } from '@/lib/graphql/profile-request'
import { graphqlRequest } from '@/lib/graphql/request'

function isEnsureProfileUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return (
    message.includes('ensure_user_profile') &&
    (message.includes('not found') ||
      message.includes('query_root') ||
      message.includes('field') ||
      message.includes('unknown'))
  )
}

export async function ensureUserProfile(
  nhost: NhostClient,
  userId: string,
): Promise<string> {
  try {
    const data = await graphqlRequest<{ ensure_user_profile: string }>(
      nhost,
      ENSURE_USER_PROFILE,
    )
    return data.ensure_user_profile
  } catch (error) {
    if (!isEnsureProfileUnavailable(error)) {
      throw error
    }
  }

  const profile = await fetchMyProfile(nhost, userId)
  if (profile?.id) {
    return profile.id
  }

  throw new Error(
    'Profil introuvable. Réessayez dans quelques secondes ou reconnectez-vous.',
  )
}
