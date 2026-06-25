import { describe, expect, it } from 'vitest'

import {
  formatDurationInput,
  parseDurationInput,
} from '@/lib/workout/parse-duration-input'

describe('parseDurationInput', () => {
  it('parses plain seconds', () => {
    expect(parseDurationInput('30')).toBe(30)
  })

  it('parses seconds suffix', () => {
    expect(parseDurationInput('45s')).toBe(45)
  })

  it('parses mm:ss', () => {
    expect(parseDurationInput('1:30')).toBe(90)
  })
})

describe('formatDurationInput', () => {
  it('returns empty string for null', () => {
    expect(formatDurationInput(null)).toBe('')
  })
})
