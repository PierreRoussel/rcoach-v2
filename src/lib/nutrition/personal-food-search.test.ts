import { describe, expect, it } from 'vitest'

import { mapFoodToSearchResult } from '@/lib/nutrition/food-search-result'
import {
  buildPersonalFoodSearchCandidates,
  isPersonalFoodSearchMatch,
  mergePersonalFoodsIntoSearchResults,
} from '@/lib/nutrition/personal-food-search'

const skyr = {
  id: 'skyr-1',
  user_id: null,
  barcode: null,
  name: 'Skyr nature',
  brand: 'Yoplait',
  calories: 60,
  carbs_g: 4,
  protein_g: 10,
  fat_g: 0,
  salt_g: null,
  sugar_g: null,
  saturated_fat_g: null,
  serving_size_g: 100,
  serving_label: '100 g',
  source: 'open_food_facts' as const,
  off_product_id: null,
  ciqual_code: null,
  created_at: '',
  updated_at: '',
}

const banana = {
  ...skyr,
  id: 'banana-1',
  name: 'Banane',
  brand: null,
}

describe('isPersonalFoodSearchMatch', () => {
  it('matches recent foods with a relevant query', () => {
    expect(isPersonalFoodSearchMatch(skyr, 'skyr')).toBe(true)
    expect(isPersonalFoodSearchMatch(skyr, 'yop')).toBe(true)
  })

  it('rejects unrelated foods', () => {
    expect(isPersonalFoodSearchMatch(skyr, 'banane')).toBe(false)
  })
})

describe('buildPersonalFoodSearchCandidates', () => {
  it('prioritizes recent foods over frequent duplicates', () => {
    const candidates = buildPersonalFoodSearchCandidates(
      [{ food: skyr, portion: { mode: 'servings', servings: 1 } }],
      [{ food: skyr, portion: { mode: 'servings', servings: 2 } }],
    )

    expect(candidates).toHaveLength(1)
    expect(candidates[0]?.badge).toBe('recent')
  })
})

describe('mergePersonalFoodsIntoSearchResults', () => {
  it('puts matching personal foods first and tags them', () => {
    const catalogResults = [
      mapFoodToSearchResult({
        ...banana,
        id: 'skyr-flavored-1',
        name: 'Skyr aromatisé',
      }),
      mapFoodToSearchResult(banana),
    ]

    const merged = mergePersonalFoodsIntoSearchResults(catalogResults, 'skyr', [
      {
        food: skyr,
        portion: { mode: 'servings', servings: 1 },
        badge: 'recent',
        rank: 0,
      },
    ])

    expect(merged.map((item) => item.name)).toEqual(['Skyr nature', 'Skyr aromatisé', 'Banane'])
    expect(merged[0]?.usageBadge).toBe('recent')
    expect(merged[0]?.quickAddPortion).toEqual({ mode: 'servings', servings: 1 })
  })

  it('keeps catalog order when no personal food matches', () => {
    const catalogResults = [mapFoodToSearchResult(banana)]

    const merged = mergePersonalFoodsIntoSearchResults(catalogResults, 'banane', [
      {
        food: skyr,
        portion: { mode: 'servings', servings: 1 },
        badge: 'recent',
        rank: 0,
      },
    ])

    expect(merged).toEqual(catalogResults)
  })
})
