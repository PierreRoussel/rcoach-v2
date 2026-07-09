export const FOOD_SEARCH_HISTORY_PREFIX = 'food-search-history:'
export const FOOD_SEARCH_HISTORY_MAX = 5

export function foodSearchHistoryKey(userId: string) {
  return `${FOOD_SEARCH_HISTORY_PREFIX}${userId}`
}

export function readFoodSearchHistory(userId: string): string[] {
  if (typeof localStorage === 'undefined') {
    return []
  }

  try {
    const raw = localStorage.getItem(foodSearchHistoryKey(userId))
    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length >= 2)
      .slice(0, FOOD_SEARCH_HISTORY_MAX)
  } catch {
    return []
  }
}

export function pushFoodSearchHistory(userId: string, query: string): string[] {
  const trimmed = query.trim()
  if (trimmed.length < 2) {
    return readFoodSearchHistory(userId)
  }

  const normalized = trimmed.toLocaleLowerCase('fr-FR')
  const next = [
    trimmed,
    ...readFoodSearchHistory(userId).filter(
      (item) => item.toLocaleLowerCase('fr-FR') !== normalized,
    ),
  ].slice(0, FOOD_SEARCH_HISTORY_MAX)

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(foodSearchHistoryKey(userId), JSON.stringify(next))
  }

  return next
}
