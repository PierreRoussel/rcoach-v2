import { describe, expect, it } from 'vitest'

import {
  getSaturatedFatQualityLevel,
  getSugarQualityLevel,
  isGoodProteinPer100g,
} from '@/lib/nutrition/food-nutrient-quality'

describe('food nutrient quality', () => {
  it('flags good protein density per 100 g', () => {
    expect(isGoodProteinPer100g(11.9)).toBe(false)
    expect(isGoodProteinPer100g(12)).toBe(true)
    expect(isGoodProteinPer100g(24)).toBe(true)
  })

  it('classifies sugar levels per 100 g', () => {
    expect(getSugarQualityLevel(3)).toBe('low')
    expect(getSugarQualityLevel(10)).toBe('medium')
    expect(getSugarQualityLevel(18)).toBe('high')
  })

  it('classifies saturated fat levels per 100 g', () => {
    expect(getSaturatedFatQualityLevel(1)).toBe('low')
    expect(getSaturatedFatQualityLevel(3)).toBe('medium')
    expect(getSaturatedFatQualityLevel(6)).toBe('high')
  })
})
