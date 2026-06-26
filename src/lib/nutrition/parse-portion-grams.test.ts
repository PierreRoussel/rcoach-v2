import { describe, expect, it } from 'vitest'

import {
  normalizeProposedFoodName,
  parsePortionGramsInput,
} from '@/lib/nutrition/parse-portion-grams'

describe('parsePortionGramsInput', () => {
  it('returns 0 for empty input', () => {
    expect(parsePortionGramsInput('')).toBe(0)
    expect(parsePortionGramsInput('   ')).toBe(0)
  })

  it('normalizes valid gram values', () => {
    expect(parsePortionGramsInput('30')).toBe(30)
    expect(parsePortionGramsInput('12.345')).toBe(12.35)
  })

  it('returns 0 for invalid values', () => {
    expect(parsePortionGramsInput('abc')).toBe(0)
  })
})

describe('normalizeProposedFoodName', () => {
  it('trims whitespace', () => {
    expect(normalizeProposedFoodName('  Yaourt nature  ')).toBe('Yaourt nature')
  })

  it('returns empty string for blank input', () => {
    expect(normalizeProposedFoodName('   ')).toBe('')
  })
})
