import { describe, expect, it } from 'vitest'

import {
  formatMealEntryQuantityGrams,
  mealEntryToPortionInput,
  resolveMealEntryQuantityGrams,
} from '@/lib/nutrition/meal-entry-display'

describe('resolveMealEntryQuantityGrams', () => {
  it('returns grams directly when provided', () => {
    expect(resolveMealEntryQuantityGrams(120, null, 50)).toBe(120)
  })

  it('converts servings to grams using serving size', () => {
    expect(resolveMealEntryQuantityGrams(null, 2, 50)).toBe(100)
  })
})

describe('formatMealEntryQuantityGrams', () => {
  it('always formats the final gram amount', () => {
    expect(formatMealEntryQuantityGrams(null, 1.5, 80)).toBe('120 g')
  })
})

describe('mealEntryToPortionInput', () => {
  it('maps stored grams to portion input', () => {
    expect(mealEntryToPortionInput({ quantity_g: 150, servings: null })).toEqual({
      mode: 'grams',
      quantityG: 150,
    })
  })

  it('maps stored servings to portion input', () => {
    expect(mealEntryToPortionInput({ quantity_g: null, servings: 2 })).toEqual({
      mode: 'servings',
      servings: 2,
    })
  })
})
