import { describe, expect, it } from 'vitest'

import {
  mapOffProductToDraft,
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
})
