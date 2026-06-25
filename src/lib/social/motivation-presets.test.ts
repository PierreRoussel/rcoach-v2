import { describe, expect, it } from 'vitest'

import {
  isValidMotivationMessage,
  MAX_MOTIVATION_MESSAGE_LENGTH,
  normalizeMotivationMessage,
} from '@/lib/social/motivation-presets'

describe('motivation-presets', () => {
  it('trims and caps message length', () => {
    const long = 'a'.repeat(MAX_MOTIVATION_MESSAGE_LENGTH + 10)
    expect(normalizeMotivationMessage(`  ${long}  `)).toHaveLength(
      MAX_MOTIVATION_MESSAGE_LENGTH,
    )
  })

  it('rejects empty messages', () => {
    expect(isValidMotivationMessage('   ')).toBe(false)
    expect(isValidMotivationMessage('Bravo !')).toBe(true)
  })
})
