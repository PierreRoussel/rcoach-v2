import { describe, expect, it } from 'vitest'

import {
  buildFrequentFoods,
  formatFoodPortionPreview,
  mealLogEntryToPortion,
  pickMostFrequentPortion,
} from '@/lib/nutrition/frequent-portion'

const skyr = {
  id: 'skyr-1',
  name: 'Skyr',
  brand: null,
  calories: 60,
  carbs_g: 4,
  protein_g: 10,
  fat_g: 0,
  serving_size_g: 100,
  serving_label: '100 g',
  source: 'open_food_facts' as const,
  off_product_id: null,
  user_id: null,
  barcode: null,
  salt_g: null,
  sugar_g: null,
  saturated_fat_g: null,
  created_at: '',
  updated_at: '',
}

describe('mealLogEntryToPortion', () => {
  it('falls back to servings when grams are invalid', () => {
    expect(mealLogEntryToPortion({ quantity_g: 0, servings: 2 })).toEqual({
      mode: 'servings',
      servings: 2,
    })
  })
})

describe('pickMostFrequentPortion', () => {
  it('returns the most logged portion for a food', () => {
    expect(
      pickMostFrequentPortion([
        { quantity_g: 150, servings: null },
        { quantity_g: 150, servings: null },
        { quantity_g: 100, servings: null },
      ]),
    ).toEqual({ mode: 'grams', quantityG: 150 })
  })
})

describe('buildFrequentFoods', () => {
  it('keeps the frequent portion per food', () => {
    const results = buildFrequentFoods(
      [
        { food_id: 'skyr-1', quantity_g: 150, servings: null, food: skyr },
        { food_id: 'skyr-1', quantity_g: 150, servings: null, food: skyr },
        { food_id: 'skyr-1', quantity_g: 100, servings: null, food: skyr },
      ],
      5,
    )

    expect(results).toHaveLength(1)
    expect(results[0]?.portion).toEqual({ mode: 'grams', quantityG: 150 })
  })
})

describe('formatFoodPortionPreview', () => {
  it('formats grams and calories for the chosen portion', () => {
    expect(formatFoodPortionPreview(skyr, { mode: 'grams', quantityG: 150 })).toBe('150 g · 90 kcal')
  })

  it('formats custom serving sizes', () => {
    expect(
      formatFoodPortionPreview(skyr, { mode: 'servings', servings: 2, servingSizeG: 30 }),
    ).toBe('60 g · 36 kcal')
  })
})
