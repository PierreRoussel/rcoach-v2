import { describe, expect, it } from 'vitest'

import { mapFoodToSearchResult, normalizeFoodNutrients } from '@/lib/nutrition/food-search-result'

const incompleteFood = {
  id: 'food-1',
  user_id: null,
  barcode: null,
  name: 'Test',
  brand: null,
  calories: undefined,
  carbs_g: undefined,
  protein_g: undefined,
  fat_g: undefined,
  salt_g: null,
  sugar_g: null,
  saturated_fat_g: null,
  serving_size_g: undefined,
  serving_label: '',
  source: 'user' as const,
  off_product_id: null,
  ciqual_code: null,
  created_at: '',
  updated_at: '',
}

describe('normalizeFoodNutrients', () => {
  it('fills missing numeric fields with safe defaults', () => {
    expect(normalizeFoodNutrients(incompleteFood)).toMatchObject({
      calories: 0,
      carbs_g: 0,
      protein_g: 0,
      fat_g: 0,
      serving_size_g: 100,
      serving_label: '100 g',
    })
  })
})

describe('mapFoodToSearchResult', () => {
  it('exposes normalized food for portion preview', () => {
    const result = mapFoodToSearchResult(incompleteFood, { mode: 'servings', servings: 1 })

    expect(result.calories).toBe(0)
    expect(result.servingSizeG).toBe(100)
    expect(result.food?.serving_size_g).toBe(100)
  })
})
