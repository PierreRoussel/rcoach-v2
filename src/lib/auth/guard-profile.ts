import type { NhostClient } from '@nhost/nhost-js'

import type { Profile } from '@/lib/graphql/operations'
import { fetchMyProfile } from '@/lib/graphql/profile-request'
import { queryClient } from '@/lib/query-client'

export const PROFILE_QUERY_STALE_MS = 5 * 60_000

export function profileQueryKey(userId: string) {
  return ['profile', 'me', userId] as const
}

export async function loadMyProfileCached(
  nhost: NhostClient,
  userId: string,
): Promise<Profile | null> {
  return queryClient.ensureQueryData({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchMyProfile(nhost, userId),
    staleTime: PROFILE_QUERY_STALE_MS,
  })
}

let ensuredProfileUserId: string | null = null

export function resetAuthenticatedProfileSession() {
  ensuredProfileUserId = null
}

export function hasEnsuredProfileForUser(userId: string) {
  return ensuredProfileUserId === userId
}

export function markProfileEnsuredForUser(userId: string) {
  ensuredProfileUserId = userId
}
