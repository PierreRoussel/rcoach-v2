import { describe, expect, it } from 'vitest'

import {
  formatMealEntryQuantityGrams,
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
