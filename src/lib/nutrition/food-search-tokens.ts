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
  options: { sourceBoost?: number } = {},
) {
  const normalizedQuery = normalizeFoodSearchQuery(query)
  let score = options.sourceBoost ?? 0

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

export function scoreCiqualFoodMatch(name: string, query: string, tokens: string[]) {
  const haystack = buildFoodSearchHaystack(name)
  let score = scoreFoodSearchMatch(haystack, query, tokens, { sourceBoost: 50 })

  const normalizedQuery = normalizeFoodSearchQuery(query)
  const nameLower = name.toLowerCase()

  if (normalizedQuery && nameLower.startsWith(normalizedQuery)) {
    score += 35
  }

  if (
    normalizedQuery &&
    (nameLower.startsWith(`${normalizedQuery},`) ||
      nameLower.startsWith(`${normalizedQuery} `))
  ) {
    score += 25
  }

  if (/\bcrue\b|\bcru\b/i.test(name)) {
    score += 15
  }

  if (/\b(sauce|préemball|appertis|purée|concentré|jus de)\b/i.test(name)) {
    score -= 20
  }

  return score
}

export function sortFoodSearchByRelevance<T>(
  items: T[],
  query: string,
  tokens: string[],
  getHaystack: (item: T) => string,
  getScore?: (item: T, haystack: string) => number,
) {
  return [...items].sort((left, right) => {
    const leftHaystack = getHaystack(left)
    const rightHaystack = getHaystack(right)
    const rightScore = getScore
      ? getScore(right, rightHaystack)
      : scoreFoodSearchMatch(rightHaystack, query, tokens)
    const leftScore = getScore
      ? getScore(left, leftHaystack)
      : scoreFoodSearchMatch(leftHaystack, query, tokens)
    return rightScore - leftScore
  })
}

export type FoodSearchSortInput = {
  source: string
  name: string
  brand?: string | null
  barcode?: string | null
}

export function scoreFoodSearchItem(
  item: FoodSearchSortInput,
  query: string,
  tokens: string[],
) {
  const haystack = buildFoodSearchHaystack(item.name, item.brand, item.barcode)

  return item.source === 'ciqual'
    ? scoreCiqualFoodMatch(item.name, query, tokens)
    : scoreFoodSearchMatch(haystack, query, tokens)
}

export function sortFoodSearchResultsGrouped<T>(
  items: T[],
  query: string,
  tokens: string[],
  getSortInput: (item: T) => FoodSearchSortInput,
) {
  const ciqualItems: T[] = []
  const otherItems: T[] = []

  for (const item of items) {
    if (getSortInput(item).source === 'ciqual') {
      ciqualItems.push(item)
      continue
    }

    otherItems.push(item)
  }

  const sortGroup = (group: T[]) =>
    [...group].sort(
      (left, right) =>
        scoreFoodSearchItem(getSortInput(right), query, tokens) -
        scoreFoodSearchItem(getSortInput(left), query, tokens),
    )

  return [...sortGroup(ciqualItems), ...sortGroup(otherItems)]
}
