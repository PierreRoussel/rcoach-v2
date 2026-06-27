import { describe, expect, it } from 'vitest'

import {
  extractFoodSearchTokens,
  foodSearchTokenMatches,
  matchesAllFoodSearchTokens,
  scoreCiqualFoodMatch,
  scoreFoodSearchMatch,
} from '@/lib/nutrition/food-search-tokens'

describe('extractFoodSearchTokens', () => {
  it('drops french stop words and deduplicates', () => {
    expect(extractFoodSearchTokens('jus de pomme jaf')).toEqual(['jus', 'pomme', 'jaf'])
  })
})

describe('foodSearchTokenMatches', () => {
  it('matches partial brand prefixes', () => {
    expect(foodSearchTokenMatches('pur jus de pomme jafaden', 'jaf')).toBe(true)
  })
})

describe('matchesAllFoodSearchTokens', () => {
  it('matches product name and brand across fields', () => {
    const haystack = 'jus de pomme jafaden'
    expect(matchesAllFoodSearchTokens(haystack, ['jus', 'pomme', 'jaf'])).toBe(true)
  })
})

describe('scoreFoodSearchMatch', () => {
  it('prefers exact phrase matches', () => {
    const exact = scoreFoodSearchMatch('pur jus de pomme jafaden', 'jus de pomme jaf', [
      'jus',
      'pomme',
      'jaf',
    ])
    const partial = scoreFoodSearchMatch('jus de pomme citron', 'jus de pomme jaf', [
      'jus',
      'pomme',
      'jaf',
    ])

    expect(exact).toBeGreaterThan(partial)
  })
})

describe('scoreCiqualFoodMatch', () => {
  it('prefers raw simple ingredients over processed tomato products', () => {
    const raw = scoreCiqualFoodMatch('Tomate ronde, crue', 'tomate', ['tomate'])
    const sauce = scoreCiqualFoodMatch('Sauce tomate aux oignons, préemballée', 'tomate', ['tomate'])

    expect(raw).toBeGreaterThan(sauce)
  })
})
