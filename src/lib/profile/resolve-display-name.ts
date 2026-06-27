type AuthUserLike = {
  displayName?: string | null
  email?: string | null
} | null

export function resolveDisplayName(
  profileName: string | null | undefined,
  user: AuthUserLike,
): string {
  if (profileName?.trim()) {
    return profileName.trim()
  }

  if (user?.displayName?.trim()) {
    return user.displayName.trim()
  }

  const email = user?.email?.trim()
  if (!email) {
    return 'Athlète'
  }

  const atIndex = email.indexOf('@')
  return atIndex === -1 ? email : email.slice(0, atIndex)
}
