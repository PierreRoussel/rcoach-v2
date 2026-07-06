import { describe, expect, it } from 'vitest'

import {
  filterNutritionTableLines,
  isPollutingNutritionLine,
} from '@/lib/nutrition/label-scan/filter-polluting-label-lines'

describe('isPollutingNutritionLine', () => {
  it('flags adult reference intake footnotes', () => {
    expect(
      isPollutingNutritionLine(
        'Apport de référence pour un adulte-type (8 400 kJ / 2 000 kcal)',
      ),
    ).toBe(true)
  })

  it('flags percentage basis footnotes', () => {
    expect(
      isPollutingNutritionLine(
        'Les pourcentages sont calculés sur la base des apports de référence',
      ),
    ).toBe(true)
  })

  it('keeps product energy lines', () => {
    expect(isPollutingNutritionLine('Valeur énergétique 180 kJ / 42 kcal')).toBe(false)
    expect(isPollutingNutritionLine('42 kcal [105 kcal (5%)')).toBe(false)
  })

  it('keeps nutrient rows', () => {
    expect(isPollutingNutritionLine('Glucides : 10,6 g')).toBe(false)
  })
})

describe('filterNutritionTableLines', () => {
  it('removes polluting lines only', () => {
    const lines = [
      'Pour 100 ml',
      'Energie : 42 kcal',
      'Apport de référence pour un adulte-type (8 400 kJ / 2 000 kcal)',
      'Glucides : 10,6 g',
    ]

    expect(filterNutritionTableLines(lines)).toEqual([
      'Pour 100 ml',
      'Energie : 42 kcal',
      'Glucides : 10,6 g',
    ])
  })
})
