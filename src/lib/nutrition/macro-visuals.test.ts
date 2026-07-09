import { describe, expect, it } from 'vitest'

import {
  buildMacroArcSegments,
  macroCalorieShares,
  resolveMacroNutrient,
} from '@/lib/nutrition/macro-visuals'

describe('macro-visuals', () => {
  it('maps French macro labels', () => {
    expect(resolveMacroNutrient('Glucides')).toBe('carbs')
    expect(resolveMacroNutrient('Protéines')).toBe('protein')
    expect(resolveMacroNutrient('Lipides')).toBe('fat')
  })

  it('splits calories by macro contribution', () => {
    const shares = macroCalorieShares({
      carbsG: 50,
      proteinG: 25,
      fatG: 10,
    })

    expect(shares.carbs).toBeCloseTo(200 / 390, 3)
    expect(shares.protein).toBeCloseTo(100 / 390, 3)
    expect(shares.fat).toBeCloseTo(90 / 390, 3)
  })

  it('builds arc segments that fill the requested length', () => {
    const segments = buildMacroArcSegments(
      { carbsG: 40, proteinG: 30, fatG: 10 },
      100,
    )

    expect(segments).toHaveLength(3)
    expect(segments.reduce((total, segment) => total + segment.length, 0)).toBeCloseTo(100)
  })
})
