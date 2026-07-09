import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FOOD_SEARCH_HISTORY_PREFIX,
  pushFoodSearchHistory,
  readFoodSearchHistory,
} from '@/lib/nutrition/food-search-history'

const USER_ID = 'user-test'

function stubLocalStorage() {
  const store = new Map<string, string>()

  vi.stubGlobal('localStorage', {
    get length() {
      return store.size
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  })
}

beforeEach(() => {
  stubLocalStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('food search history', () => {
  it('stores up to five unique recent queries', () => {
    pushFoodSearchHistory(USER_ID, 'pomme')
    pushFoodSearchHistory(USER_ID, 'banane')
    pushFoodSearchHistory(USER_ID, 'yaourt')
    pushFoodSearchHistory(USER_ID, 'pain')
    pushFoodSearchHistory(USER_ID, 'riz')
    pushFoodSearchHistory(USER_ID, 'pates')

    expect(readFoodSearchHistory(USER_ID)).toEqual(['pates', 'riz', 'pain', 'yaourt', 'banane'])
  })

  it('moves an existing query to the front', () => {
    pushFoodSearchHistory(USER_ID, 'pomme')
    pushFoodSearchHistory(USER_ID, 'banane')
    pushFoodSearchHistory(USER_ID, 'pomme')

    expect(readFoodSearchHistory(USER_ID)).toEqual(['pomme', 'banane'])
  })

  it('ignores queries shorter than two characters', () => {
    pushFoodSearchHistory(USER_ID, 'a')

    expect(readFoodSearchHistory(USER_ID)).toEqual([])
    expect(localStorage.getItem(`${FOOD_SEARCH_HISTORY_PREFIX}${USER_ID}`)).toBeNull()
  })
})
