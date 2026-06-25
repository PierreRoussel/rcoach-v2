import { describe, expect, it } from 'vitest'

import {
  mapFoodToOffDraft,
  mapOffProductToDraft,
  OFF_MIN_QUERY_LENGTH,
} from '@/lib/nutrition/open-food-facts'

describe('open-food-facts', () => {
  it('normalizes array brands from search-a-licious shaped payloads', () => {
    const draft = mapOffProductToDraft({
      code: '123',
      product_name: 'Cola',
      brands: ['Brand A', 'Brand B'],
      nutriments: {
        'energy-kcal_100g': 42,
        carbohydrates_100g: 10,
        proteins_100g: 0,
        fat_100g: 0,
      },
    })

    expect(draft?.brand).toBe('Brand A')
  })

  it('maps cached foods back to OFF drafts', () => {
    const draft = mapFoodToOffDraft({
      id: 'food-1',
      user_id: null,
      barcode: '3017620422003',
      name: 'Nutella',
      brand: 'Ferrero',
      calories: 539,
      carbs_g: 57.5,
      protein_g: 6.3,
      fat_g: 30.9,
      salt_g: 0.1,
      sugar_g: 56.3,
      saturated_fat_g: 10.6,
      serving_size_g: 100,
      serving_label: '100 g',
      source: 'open_food_facts',
      off_product_id: '3017620422003',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    })

    expect(draft?.offProductId).toBe('3017620422003')
    expect(draft?.calories).toBe(539)
  })

  it('requires at least four characters before auto OFF search', () => {
    expect(OFF_MIN_QUERY_LENGTH).toBe(4)
  })
})
