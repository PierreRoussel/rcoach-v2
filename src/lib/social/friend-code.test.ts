import { describe, expect, it } from 'vitest'

import {
  FRIEND_CODE_PATTERN,
  isValidFriendCode,
  normalizeFriendCode,
} from '@/lib/social/friend-code'

describe('friend-code', () => {
  it('normalizes casing and whitespace', () => {
    expect(normalizeFriendCode('  rcoach-abc123  ')).toBe('RCOACH-ABC123')
  })

  it('accepts valid friend codes', () => {
    expect(isValidFriendCode('RCOACH-ABC123')).toBe(true)
    expect(FRIEND_CODE_PATTERN.test('RCOACH-ABC123')).toBe(true)
  })

  it('rejects invalid friend codes', () => {
    expect(isValidFriendCode('RCOACH-ABC12')).toBe(false)
    expect(isValidFriendCode('COACH-ABC123')).toBe(false)
    expect(isValidFriendCode('')).toBe(false)
  })
})
