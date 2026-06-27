import type { NhostClient } from '@nhost/nhost-js'

import type { ProfileUpdateInput } from '@/lib/graphql/operations'
import { fetchMyProfile, updateMyProfile } from '@/lib/graphql/profile-request'

type OAuthAuthUser = {
  id: string
  displayName?: string | null
  avatarUrl?: string | null
  email?: string | null
}

function isGenericDisplayName(
  displayName: string,
  email: string | null | undefined,
): boolean {
  const trimmed = displayName.trim()
  if (!trimmed || trimmed === 'User') {
    return true
  }

  if (!email) {
    return false
  }

  const localPart = email.split('@')[0]?.toLowerCase()
  return Boolean(localPart && trimmed.toLowerCase() === localPart)
}

export function buildOAuthProfileUpdates(
  profile: {
    display_name: string
    avatar_url: string | null
  },
  user: OAuthAuthUser,
): ProfileUpdateInput {
  const changes: ProfileUpdateInput = {}

  if (!profile.avatar_url?.trim() && user.avatarUrl?.trim()) {
    changes.avatar_url = user.avatarUrl.trim()
  }

  if (
    user.displayName?.trim() &&
    isGenericDisplayName(profile.display_name, user.email)
  ) {
    changes.display_name = user.displayName.trim()
  }

  return changes
}

/** Fills missing profile avatar/display name from the OAuth auth user record. */
export async function syncOAuthProfile(nhost: NhostClient, user: OAuthAuthUser) {
  const profile = await fetchMyProfile(nhost, user.id)
  if (!profile) {
    return null
  }

  const changes = buildOAuthProfileUpdates(profile, user)
  if (Object.keys(changes).length === 0) {
    return profile
  }

  return updateMyProfile(nhost, profile.id, changes)
}
