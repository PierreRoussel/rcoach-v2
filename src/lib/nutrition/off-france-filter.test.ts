import { describe, expect, it } from 'vitest'

import {
  filterOffFranceLiteLine,
  hasMacronutrients,
  isFranceProduct,
  shouldKeepFranceLiteProduct,
  toFranceLiteProduct,
} from '@/lib/nutrition/off-france-filter'

const baseProduct = {
  code: '3017620422003',
  product_name: 'Nutella',
  brands: 'Ferrero',
  countries_tags: ['en:france'],
  nutriments: {
    'energy-kcal_100g': 539,
    carbohydrates_100g: 57.5,
    proteins_100g: 6.3,
    fat_100g: 30.9,
  },
}

describe('off-france-filter', () => {
  it('detects France via countries_tags', () => {
    expect(isFranceProduct(baseProduct)).toBe(true)
    expect(isFranceProduct({ countries: 'Belgium,France' })).toBe(true)
    expect(isFranceProduct({ countries_tags: ['en:belgium'] })).toBe(false)
  })

  it('requires all main macronutrients per 100g', () => {
    expect(hasMacronutrients(baseProduct.nutriments)).toBe(true)
    expect(
      hasMacronutrients({
        'energy-kcal_100g': 100,
        carbohydrates_100g: 10,
        proteins_100g: 5,
      }),
    ).toBe(false)
  })

  it('keeps only France products with name and macros', () => {
    expect(shouldKeepFranceLiteProduct(baseProduct)).toBe(true)
    expect(
      shouldKeepFranceLiteProduct({
        ...baseProduct,
        product_name: '   ',
      }),
    ).toBe(false)
    expect(
      shouldKeepFranceLiteProduct({
        ...baseProduct,
        countries_tags: ['en:spain'],
      }),
    ).toBe(false)
    expect(
      shouldKeepFranceLiteProduct({
        ...baseProduct,
        no_nutriments: true,
      }),
    ).toBe(false)
  })

  it('maps to a slim export record', () => {
    expect(toFranceLiteProduct(baseProduct)).toEqual({
      code: '3017620422003',
      product_name: 'Nutella',
      brands: 'Ferrero',
      nutriments: {
        'energy-kcal_100g': 539,
        carbohydrates_100g: 57.5,
        proteins_100g: 6.3,
        fat_100g: 30.9,
        salt_100g: null,
        sugars_100g: null,
        'saturated-fat_100g': null,
      },
      serving_size: null,
      serving_quantity: null,
    })
  })

  it('parses jsonl lines', () => {
    const kept = filterOffFranceLiteLine(JSON.stringify(baseProduct))
    expect(kept?.product_name).toBe('Nutella')
    expect(filterOffFranceLiteLine('{ invalid json')).toBeNull()
  })
})
