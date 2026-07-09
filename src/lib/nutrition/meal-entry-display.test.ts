import { describe, expect, it } from 'vitest'

import {
  formatMealEntryQuantityFields,
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

describe('formatMealEntryQuantityFields', () => {
  it('formats servings as portion count', () => {
    expect(formatMealEntryQuantityFields(null, 2, '100 g')).toBe('2 portions')
    expect(formatMealEntryQuantityFields(null, 1, '100 g')).toBe('1 portion')
  })

  it('uses the serving label when it is not gram-based', () => {
    expect(formatMealEntryQuantityFields(null, 2, 'pot')).toBe('2 pots')
    expect(formatMealEntryQuantityFields(null, 1, 'tranche')).toBe('1 tranche')
  })

  it('formats grams when quantity is stored in grams', () => {
    expect(formatMealEntryQuantityFields(150, null, '100 g')).toBe('150 g')
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

  it('prefers valid servings when grams are zero', () => {
    expect(mealEntryToPortionInput({ quantity_g: 0, servings: 2 })).toEqual({
      mode: 'servings',
      servings: 2,
    })
  })
})
