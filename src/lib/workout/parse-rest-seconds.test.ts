import { describe, expect, it } from 'vitest'

import { parseRestSecondsInput } from '@/lib/workout/parse-rest-seconds'

describe('parseRestSecondsInput', () => {
  it('returns 0 for empty input', () => {
    expect(parseRestSecondsInput('')).toBe(0)
    expect(parseRestSecondsInput('   ')).toBe(0)
  })

  it('parses valid seconds', () => {
    expect(parseRestSecondsInput('90')).toBe(90)
    expect(parseRestSecondsInput('45.6')).toBe(46)
  })

  it('clamps negative values to 0', () => {
    expect(parseRestSecondsInput('-5')).toBe(0)
  })
})
