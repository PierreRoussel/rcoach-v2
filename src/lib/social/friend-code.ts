export const FRIEND_CODE_PREFIX = 'RCOACH-'
export const FRIEND_CODE_PATTERN = /^RCOACH-[A-Z0-9]{6}$/

export function normalizeFriendCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isValidFriendCode(input: string): boolean {
  return FRIEND_CODE_PATTERN.test(normalizeFriendCode(input))
}
