import type { NhostClient } from '@nhost/nhost-js'

import { ENSURE_USER_PROFILE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { fetchMyProfile } from '@/lib/graphql/profile-request'

const PROFILE_FETCH_DELAYS_MS = [0, 400, 900, 1500, 2000] as const
const ACCESS_TOKEN_WAIT_MS = 3_000

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

async function waitForAccessToken(nhost: NhostClient, maxWaitMs = ACCESS_TOKEN_WAIT_MS) {
  const started = Date.now()

  while (Date.now() - started < maxWaitMs) {
    if (nhost.getUserSession()?.accessToken) {
      return true
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 50)
    })
  }

  return Boolean(nhost.getUserSession()?.accessToken)
}

async function tryFetchProfile(nhost: NhostClient, userId: string) {
  try {
    return await fetchMyProfile(nhost, userId)
  } catch {
    return null
  }
}

async function createUserProfileViaRpc(nhost: NhostClient) {
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
  await waitForAccessToken(nhost)

  if (!nhost.getUserSession()?.accessToken) {
    throw new Error('Session expirée. Reconnectez-vous.')
  }

  let rpcUnavailable = false

  for (const delayMs of PROFILE_FETCH_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs)
      })
    }

    const profile = await tryFetchProfile(nhost, userId)
    if (profile?.id) {
      return profile.id
    }

    const createdProfileId = await createUserProfileViaRpc(nhost)
    if (createdProfileId) {
      return createdProfileId
    }

    rpcUnavailable = true
  }

  const profile = await tryFetchProfile(nhost, userId)
  if (profile?.id) {
    return profile.id
  }

  if (rpcUnavailable) {
    throw new Error(
      'Profil introuvable : le provisionnement est indisponible. Réessayez dans quelques minutes après le déploiement backend, ou reconnectez-vous.',
    )
  }

  throw new Error(
    'Profil introuvable. Réessayez dans quelques secondes ou reconnectez-vous.',
  )
}
