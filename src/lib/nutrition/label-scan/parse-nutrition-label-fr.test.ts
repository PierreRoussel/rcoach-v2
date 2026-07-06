import { describe, expect, it } from 'vitest'

import { detectReferenceBasis, servingLabelForBasis } from '@/lib/nutrition/label-scan/detect-reference-basis'
import {
  formatParsedNutrientForInput,
  parseNutritionLabelFr,
} from '@/lib/nutrition/label-scan/parse-nutrition-label-fr'
import { parseOcrMacroValue } from '@/lib/nutrition/label-scan/parse-ocr-nutrient-value'
import { referenceColumnTail } from '@/lib/nutrition/label-scan/split-nutrition-columns'
import { parsedLabelHasMacros } from '@/lib/nutrition/label-scan/types'
import { validateParsedNutrition } from '@/lib/nutrition/label-scan/validate-parsed-nutrition'

const CLEAN_LABEL = `
INFORMATIONS NUTRITIONNELLES
Pour 100 g
Valeur énergétique 1856 kJ / 444 kcal
Matières grasses 12 g
dont acides gras saturés 3,5 g
Glucides 58 g
dont sucres 22 g
Fibres alimentaires 4 g
Protéines 6 g
Sel 1,2 g
`

const NOISY_BEVERAGE_OCR = `
DECLARATION NUTRITIONNELLE
POUR 100 ml 250 ml
Energie : 180 kJ/ | 450 kJ/
42 kcal [105 kcal (5%)
Matières grasses : 09] 0g (0
dontacides gras saturés: Og| Ou c
Glucides : 1069 | 279 (103)
dontsucres : 1069] 279 (29
Protéines : 0g 0g (0
Sel : 0g 0g (0
`

describe('detectReferenceBasis', () => {
  it('detects 100 ml labels', () => {
    expect(detectReferenceBasis('POUR 100 ml 250 ml')).toBe('100ml')
    expect(servingLabelForBasis('100ml')).toBe('100 ml')
  })

  it('defaults to 100 g', () => {
    expect(detectReferenceBasis(CLEAN_LABEL)).toBe('100g')
  })
})

describe('referenceColumnTail', () => {
  it('keeps the first column when OCR splits values', () => {
    expect(referenceColumnTail('1069 | 279 (103)')).toBe('1069')
    expect(referenceColumnTail('42 kcal [105 kcal (5%)')).toBe('42 kcal')
  })
})

describe('parseOcrMacroValue', () => {
  it('repairs a missing decimal separator', () => {
    expect(parseOcrMacroValue('1069')).toBe(10.69)
  })

  it('reads leading-zero decimals from OCR tokens', () => {
    expect(parseOcrMacroValue('09')).toBe(0.9)
    expect(parseOcrMacroValue('05')).toBe(0.5)
  })
})

describe('validateParsedNutrition', () => {
  it('caps sugar to carbs when OCR picked the wrong column', () => {
    const result = validateParsedNutrition({
      calories: 42,
      carbsG: 10.6,
      proteinG: 0,
      fatG: 0.9,
      saltG: 0,
      sugarG: 27.9,
      saturatedFatG: 0,
    })

    expect(result.nutrients.sugarG).toBe(10.6)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('deduces calories from macros when energy is missing', () => {
    const result = validateParsedNutrition({
      calories: null,
      carbsG: 10,
      proteinG: 5,
      fatG: 2,
      saltG: null,
      sugarG: null,
      saturatedFatG: null,
    })

    expect(result.nutrients.calories).toBe(78)
    expect(result.fieldHints.calories).toBeTruthy()
    expect(result.warnings.some((warning) => /déduite/i.test(warning))).toBe(true)
  })
})

describe('parseNutritionLabelFr', () => {
  it('extracts per-100g macros from a standard French label', () => {
    const parsed = parseNutritionLabelFr(CLEAN_LABEL)

    expect(parsed.nutrients).toEqual({
      calories: 444,
      fatG: 12,
      saturatedFatG: 3.5,
      carbsG: 58,
      sugarG: 22,
      proteinG: 6,
      saltG: 1.2,
    })
    expect(parsed.basis).toBe('100g')
    expect(parsedLabelHasMacros(parsed.nutrients)).toBe(true)
  })

  it('prefers the first gram column when two portions are present', () => {
    const parsed = parseNutritionLabelFr(`
Pour 100g Pour 1 portion
Matières grasses 10 g 5 g
Glucides 40 g 20 g
Protéines 8 g 4 g
Valeur énergétique 1674 kJ / 400 kcal 837 kJ / 200 kcal
`)

    expect(parsed.nutrients.fatG).toBe(10)
    expect(parsed.nutrients.carbsG).toBe(40)
    expect(parsed.nutrients.proteinG).toBe(8)
    expect(parsed.nutrients.calories).toBe(400)
  })

  it('handles noisy OCR text', () => {
    const parsed = parseNutritionLabelFr(`
Valeur énergétique  950 kJ / 227 kcal
Lipides 8,2 g
dont acides gras saturés < 0,5 g
Glucides 31 g
dont sucres 14,5 g
Protéines 11 g
Sel 0,9 g
`)

    expect(parsed.nutrients.calories).toBe(227)
    expect(parsed.nutrients.fatG).toBe(8.2)
    expect(parsed.nutrients.saturatedFatG).toBe(0.5)
    expect(parsed.nutrients.carbsG).toBe(31)
    expect(parsed.nutrients.sugarG).toBe(14.5)
    expect(parsed.nutrients.proteinG).toBe(11)
    expect(parsed.nutrients.saltG).toBe(0.9)
  })

  it('parses a very noisy beverage label OCR sample', () => {
    const parsed = parseNutritionLabelFr(NOISY_BEVERAGE_OCR)

    expect(parsed.basis).toBe('100ml')
    expect(parsed.nutrients.calories).toBe(42)
    expect(parsed.nutrients.fatG).toBe(0.9)
    expect(parsed.nutrients.saturatedFatG).toBe(0)
    expect(parsed.nutrients.carbsG).toBe(10.69)
    expect(parsed.nutrients.sugarG).toBe(10.69)
    expect(parsed.nutrients.proteinG).toBe(0)
    expect(parsed.nutrients.saltG).toBe(0)
  })

  it('prefers explicit kcal over kJ conversion on energy lines', () => {
    const parsed = parseNutritionLabelFr(`
Energie : 180 kJ/ | 450 kJ/
42 kcal [105 kcal (5%)
`)

    expect(parsed.nutrients.calories).toBe(42)
  })

  it('parses glued dontsucres OCR labels', () => {
    const parsed = parseNutritionLabelFr(`
Glucides 58 g
dontsucres: 145} 3200
`)

    expect(parsed.nutrients.carbsG).toBe(58)
    expect(parsed.nutrients.sugarG).toBe(14.5)
  })

  it('parses dontsucres without separator before the value', () => {
    const parsed = parseNutritionLabelFr('dontsucres12g')

    expect(parsed.nutrients.sugarG).toBe(12)
  })

  it('parses sodium in mg as salt grams', () => {
    const parsed = parseNutritionLabelFr('Sodium : 400 mg')

    expect(parsed.nutrients.saltG).toBe(1)
  })

  it('converts kJ-only energy lines to kcal', () => {
    const parsed = parseNutritionLabelFr('Énergie 836 kJ')

    expect(parsed.nutrients.calories).toBe(200)
  })

  it('deduces calories when the energy line is missing', () => {
    const parsed = parseNutritionLabelFr(`
Pour 100 g
Matières grasses 12 g
Glucides 58 g
Protéines 6 g
Sel 1,2 g
`)

    expect(parsed.nutrients.calories).toBe(58 * 4 + 6 * 4 + 12 * 9)
    expect(parsed.fieldHints.calories).toBeTruthy()
  })

  it('ignores adult reference intake footnotes', () => {
    const parsed = parseNutritionLabelFr(`
POUR 100 ml
Energie : 180 kJ / 42 kcal
Glucides : 10,6 g
dont sucres : 10,6 g
Protéines : 0 g
Matières grasses : 0,9 g
Sel : 0 g
Apport de référence pour un adulte-type (8 400 kJ / 2 000 kcal)
Les pourcentages sont calculés sur la base des apports de référence
`)

    expect(parsed.nutrients.calories).toBe(42)
    expect(parsed.nutrients.carbsG).toBe(10.6)
  })

  it('returns empty values for unrelated text', () => {
    const parsed = parseNutritionLabelFr('Yaourt nature bio')

    expect(parsedLabelHasMacros(parsed.nutrients)).toBe(false)
    expect(parsed.confidence).toBe('low')
  })
})

describe('formatParsedNutrientForInput', () => {
  it('formats integers without decimals', () => {
    expect(formatParsedNutrientForInput(12)).toBe('12')
  })

  it('keeps decimal values', () => {
    expect(formatParsedNutrientForInput(3.5)).toBe('3.5')
  })
})
