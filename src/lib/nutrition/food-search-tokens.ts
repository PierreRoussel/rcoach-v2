const FOOD_SEARCH_STOP_WORDS = new Set([
  'a',
  'au',
  'aux',
  'd',
  'de',
  'des',
  'du',
  'en',
  'et',
  'l',
  'la',
  'le',
  'les',
  'un',
  'une',
])

export const FOOD_SEARCH_MIN_TOKEN_LENGTH = 2
export const FOOD_SEARCH_MAX_TOKENS = 6

export function normalizeFoodSearchQuery(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function extractFoodSearchTokens(query: string) {
  const normalized = normalizeFoodSearchQuery(query)
  if (!normalized) {
    return []
  }

  const tokens = normalized
    .split(' ')
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= FOOD_SEARCH_MIN_TOKEN_LENGTH &&
        !FOOD_SEARCH_STOP_WORDS.has(token),
    )

  return [...new Set(tokens)].slice(0, FOOD_SEARCH_MAX_TOKENS)
}

export function buildFoodSearchHaystack(
  name: string,
  brand?: string | null,
  barcode?: string | null,
) {
  return [name, brand, barcode].filter(Boolean).join(' ').toLowerCase()
}

export function foodSearchTokenMatches(haystack: string, token: string) {
  if (!token) {
    return true
  }

  if (haystack.includes(token)) {
    return true
  }

  return haystack.split(/[\s,.;/+-]+/).some((word) => {
    if (!word) {
      return false
    }

    return word.startsWith(token) || token.startsWith(word)
  })
}

export function matchesAllFoodSearchTokens(haystack: string, tokens: string[]) {
  if (tokens.length === 0) {
    return true
  }

  return tokens.every((token) => foodSearchTokenMatches(haystack, token))
}

export function scoreFoodSearchMatch(
  haystack: string,
  query: string,
  tokens: string[],
) {
  const normalizedQuery = normalizeFoodSearchQuery(query)
  let score = 0

  if (normalizedQuery && haystack.includes(normalizedQuery)) {
    score += 100
  }

  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 10
    } else if (foodSearchTokenMatches(haystack, token)) {
      score += 6
    }
  }

  return score
}

export function sortFoodSearchByRelevance<T>(
  items: T[],
  query: string,
  tokens: string[],
  getHaystack: (item: T) => string,
) {
  return [...items].sort((left, right) => {
    const rightScore = scoreFoodSearchMatch(getHaystack(right), query, tokens)
    const leftScore = scoreFoodSearchMatch(getHaystack(left), query, tokens)
  return rightScore - leftScore
  })
}
