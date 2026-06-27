import { describe, expect, it } from 'vitest'

import { isGoogleOnlyAccount } from '@/hooks/useAuthProviders'

describe('isGoogleOnlyAccount', () => {
  it('returns true when Google is the only linked provider', () => {
    expect(isGoogleOnlyAccount(['google'])).toBe(true)
  })

  it('returns false for mixed or email-only accounts', () => {
    expect(isGoogleOnlyAccount(['google', 'email'])).toBe(false)
    expect(isGoogleOnlyAccount(['email'])).toBe(false)
    expect(isGoogleOnlyAccount(undefined)).toBe(false)
  })
})
