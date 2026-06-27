import { describe, expect, it } from 'vitest'

import { validateNewPassword } from '@/lib/auth/password-policy'

describe('validateNewPassword', () => {
  it('accepts a strong password different from the current one', () => {
    expect(validateNewPassword('Nouveau99', 'Ancien88')).toEqual({
      isValid: true,
      issues: [],
    })
  })

  it('rejects passwords that match policy gaps', () => {
    expect(validateNewPassword('abc', 'abc')).toMatchObject({
      isValid: false,
      issues: expect.arrayContaining(['too-short', 'missing-digit', 'same-as-current']),
    })
  })
})
