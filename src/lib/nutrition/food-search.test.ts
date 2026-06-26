import { describe, expect, it } from 'vitest'

import {
  buildFoodSearchContainsPattern,
  buildFoodSearchPattern,
} from '@/lib/nutrition/food-search'

describe('buildFoodSearchPattern', () => {
  it('uses prefix search for short single-token queries', () => {
    expect(buildFoodSearchPattern('nut')).toEqual({
      pattern: 'nut%',
      mode: 'prefix',
    })
  })

  it('uses contains search for multi-word queries', () => {
    expect(buildFoodSearchPattern('pomme golden')).toEqual({
      pattern: '%pomme golden%',
      mode: 'contains',
    })
  })

  it('uses contains search for longer single-token queries', () => {
    expect(buildFoodSearchPattern('nutella')).toEqual({
      pattern: '%nutella%',
      mode: 'contains',
    })
  })

  it('normalizes casing and whitespace', () => {
    expect(buildFoodSearchPattern('  NuTeLLa  ')).toEqual({
      pattern: '%nutella%',
      mode: 'contains',
    })
  })
})

describe('buildFoodSearchContainsPattern', () => {
  it('wraps the normalized query', () => {
    expect(buildFoodSearchContainsPattern('  Foo Bar ')).toBe('%foo bar%')
  })
})
