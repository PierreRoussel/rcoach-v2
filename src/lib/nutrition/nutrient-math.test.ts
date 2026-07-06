import { describe, expect, it } from 'vitest'

import { portionGrams, scaleExtendedNutrients, scaleNutrientsPer100g } from '@/lib/nutrition/nutrient-math'

const food = {
  calories: 200,
  carbs_g: 10,
  protein_g: 20,
  fat_g: 5,
  serving_size_g: 100,
  salt_g: 1,
  sugar_g: 2,
  saturated_fat_g: 1,
}

describe('portionGrams', () => {
  it('uses custom servingSizeG for servings mode', () => {
    expect(
      portionGrams(food, { mode: 'servings', servings: 2, servingSizeG: 30 }),
    ).toBe(60)
  })
})

describe('scaleNutrientsPer100g', () => {
  it('scales nutrients using custom servingSizeG', () => {
    expect(
      scaleNutrientsPer100g(food, { mode: 'servings', servings: 2, servingSizeG: 30 }),
    ).toEqual({
      calories: 120,
      carbsG: 6,
      proteinG: 12,
      fatG: 3,
    })
  })
})

describe('scaleExtendedNutrients', () => {
  it('scales optional nutrients using custom servingSizeG', () => {
    expect(
      scaleExtendedNutrients(food, { mode: 'servings', servings: 2, servingSizeG: 30 }),
    ).toEqual({
      calories: 120,
      carbsG: 6,
      proteinG: 12,
      fatG: 3,
      saltG: 0.6,
      sugarG: 1.2,
      saturatedFatG: 0.6,
    })
  })
})
