import { describe, expect, it } from 'vitest'

import {
  formatParsedNutrientForInput,
  parseNutritionLabelFr,
} from '@/lib/nutrition/label-scan/parse-nutrition-label-fr'
import { parseOcrMacroValue } from '@/lib/nutrition/label-scan/parse-ocr-nutrient-value'
import { parsedLabelHasMacros } from '@/lib/nutrition/label-scan/types'

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
\. 42kcal 105kcal (5) | GS
ant. | Matières grasses : 09] 05 00 E
dontacides gras saturés: Og| Ou c —
; Jucides : 1069} 279001 A
} + foteines : "es 0g 0 il (0 Ji '
' | Sel : = 09 0g Ç F
`

describe('parseOcrMacroValue', () => {
  it('repairs a missing decimal separator', () => {
    expect(parseOcrMacroValue('1069')).toBe(10.69)
  })

  it('reads leading-zero decimals from OCR tokens', () => {
    expect(parseOcrMacroValue('09')).toBe(0.9)
    expect(parseOcrMacroValue('05')).toBe(0.5)
  })
})

describe('parseNutritionLabelFr', () => {
  it('extracts per-100g macros from a standard French label', () => {
    const parsed = parseNutritionLabelFr(CLEAN_LABEL)

    expect(parsed).toEqual({
      calories: 444,
      fatG: 12,
      saturatedFatG: 3.5,
      carbsG: 58,
      sugarG: 22,
      proteinG: 6,
      saltG: 1.2,
    })
    expect(parsedLabelHasMacros(parsed)).toBe(true)
  })

  it('prefers the first gram column when two portions are present', () => {
    const parsed = parseNutritionLabelFr(`
Pour 100g Pour 1 portion
Matières grasses 10 g 5 g
Glucides 40 g 20 g
Protéines 8 g 4 g
Valeur énergétique 1674 kJ / 400 kcal 837 kJ / 200 kcal
`)

    expect(parsed.fatG).toBe(10)
    expect(parsed.carbsG).toBe(40)
    expect(parsed.proteinG).toBe(8)
    expect(parsed.calories).toBe(400)
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

    expect(parsed.calories).toBe(227)
    expect(parsed.fatG).toBe(8.2)
    expect(parsed.saturatedFatG).toBe(0.5)
    expect(parsed.carbsG).toBe(31)
    expect(parsed.sugarG).toBe(14.5)
    expect(parsed.proteinG).toBe(11)
    expect(parsed.saltG).toBe(0.9)
  })

  it('parses a very noisy beverage label OCR sample', () => {
    const parsed = parseNutritionLabelFr(NOISY_BEVERAGE_OCR)

    expect(parsed.calories).toBe(42)
    expect(parsed.fatG).toBe(0.9)
    expect(parsed.saturatedFatG).toBe(0)
    expect(parsed.carbsG).toBe(10.69)
    expect(parsed.proteinG).toBe(0)
    expect(parsed.saltG).toBe(0)
  })

  it('prefers explicit kcal over kJ conversion on energy lines', () => {
    const parsed = parseNutritionLabelFr(`
Energie : 180 kJ/ | 450 kJ/
42 kcal [105 kcal (5%)
`)

    expect(parsed.calories).toBe(42)
  })

  it('parses glued dontsucres OCR labels', () => {
    const parsed = parseNutritionLabelFr(`
Glucides 58 g
dontsucres: 145} 3200
`)

    expect(parsed.carbsG).toBe(58)
    expect(parsed.sugarG).toBe(14.5)
  })

  it('parses dontsucres without separator before the value', () => {
    const parsed = parseNutritionLabelFr('dontsucres12g')

    expect(parsed.sugarG).toBe(12)
  })

  it('converts kJ-only energy lines to kcal', () => {
    const parsed = parseNutritionLabelFr('Énergie 836 kJ')

    expect(parsed.calories).toBe(200)
  })

  it('returns empty values for unrelated text', () => {
    const parsed = parseNutritionLabelFr('Yaourt nature bio')

    expect(parsedLabelHasMacros(parsed)).toBe(false)
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
