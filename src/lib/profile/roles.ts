import type { Profile, ProfileRole } from '@/lib/graphql/operations'

export type EditableProfileRole = Exclude<ProfileRole, 'admin'>

export function isAdminProfile(
  profile: Pick<Profile, 'role'> | null | undefined,
): boolean {
  return profile?.role === 'admin'
}

export function isCoachProfile(
  profile: Pick<Profile, 'role'> | null | undefined,
): boolean {
  return (
    profile?.role === 'coach' ||
    profile?.role === 'both' ||
    profile?.role === 'admin'
  )
}

export function canEditProfileRole(
  profile: Pick<Profile, 'role'> | null | undefined,
): boolean {
  return profile?.role !== 'admin'
}
