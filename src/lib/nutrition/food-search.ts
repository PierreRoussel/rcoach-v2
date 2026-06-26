import type { NhostClient } from '@nhost/nhost-js'

import {
  FOOD_SEARCH_FIELDS,
  SEARCH_OFF_FOODS,
  SEARCH_USER_FOODS,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  buildFoodSearchHaystack,
  extractFoodSearchTokens,
  matchesAllFoodSearchTokens,
  normalizeFoodSearchQuery,
  sortFoodSearchByRelevance,
} from '@/lib/nutrition/food-search-tokens'
import type { Food } from '@/lib/nutrition/types'

export const USER_FOOD_SEARCH_MIN_LENGTH = 2
export const OFF_CATALOG_DB_MIN_LENGTH = 3
export const OFF_CATALOG_CONTAINS_MIN_LENGTH = 5
export const OFF_CATALOG_FALLBACK_MIN_RESULTS = 12

export type FoodSearchPattern = {
  pattern: string
  mode: 'prefix' | 'contains'
}

export { normalizeFoodSearchQuery }

export function buildFoodSearchPattern(query: string): FoodSearchPattern {
  const normalized = normalizeFoodSearchQuery(query)
  if (!normalized) {
    return { pattern: '%', mode: 'contains' }
  }

  if (normalized.includes(' ') || normalized.length >= OFF_CATALOG_CONTAINS_MIN_LENGTH) {
    return { pattern: `%${normalized}%`, mode: 'contains' }
  }

  return { pattern: `${normalized}%`, mode: 'prefix' }
}

export function buildFoodSearchContainsPattern(query: string) {
  const normalized = normalizeFoodSearchQuery(query)
  return normalized ? `%${normalized}%` : '%'
}

function mergeFoodSearchResults(userFoods: Food[], offFoods: Food[], limit: number) {
  const merged = new Map<string, Food>()

  for (const food of userFoods) {
    merged.set(food.id, food)
  }

  for (const food of offFoods) {
    const key = food.off_product_id ?? food.id
    if (!merged.has(key)) {
      merged.set(key, food)
    }
  }

  return Array.from(merged.values()).slice(0, limit)
}

function buildTokenAndSearchQuery(tokens: string[], scope: 'user' | 'off') {
  const variableDefinitions = [...tokens.map((_, index) => `$token${index}: String!`), '$limit: Int!'].join(
    ', ',
  )
  const tokenConditions = tokens
    .map((_, index) => `{ search_text: { _ilike: $token${index} } }`)
    .join('\n            ')
  const scopeCondition =
    scope === 'user'
      ? '{ user_id: { _eq: X-Hasura-User-Id } }'
      : "{ source: { _eq: open_food_facts } }"

  return `
    query SearchFoodsByTokens(${variableDefinitions}) {
      foods(
        where: {
          _and: [
            ${scopeCondition}
            ${tokenConditions}
          ]
        }
        order_by: [{ name: asc }]
        limit: $limit
      ) {
${FOOD_SEARCH_FIELDS}
      }
    }
  `
}

async function searchFoodsByTokens(
  nhost: NhostClient,
  tokens: string[],
  scope: 'user' | 'off',
  limit: number,
) {
  if (tokens.length === 0) {
    return []
  }

  const variables = {
    ...Object.fromEntries(tokens.map((token, index) => [`token${index}`, `%${token}%`])),
    limit,
  }

  const response = await graphqlRequest<{ foods: Food[] }>(
    nhost,
    buildTokenAndSearchQuery(tokens, scope),
    variables,
  )

  return response.foods
}

function rankFoodSearchResults(foods: Food[], query: string, tokens: string[]) {
  return sortFoodSearchByRelevance(foods, query, tokens, (food) =>
    buildFoodSearchHaystack(food.name, food.brand, food.barcode),
  )
}

function hasRelevantFoodMatches(foods: Food[], query: string, tokens: string[]) {
  if (tokens.length < 2) {
    return foods.length > 0
  }

  return foods.some((food) =>
    matchesAllFoodSearchTokens(
      buildFoodSearchHaystack(food.name, food.brand, food.barcode),
      tokens,
    ),
  )
}

export async function searchFoodsInDatabase(
  nhost: NhostClient,
  query: string,
  options: {
    userLimit?: number
    offLimit?: number
    totalLimit?: number
  } = {},
) {
  const trimmed = query.trim()
  const userLimit = options.userLimit ?? 10
  const offLimit = options.offLimit ?? 20
  const totalLimit = options.totalLimit ?? 25
  const tokens = extractFoodSearchTokens(trimmed)

  if (trimmed.length < USER_FOOD_SEARCH_MIN_LENGTH) {
    return []
  }

  const { pattern, mode } = buildFoodSearchPattern(trimmed)
  const requests: Array<Promise<{ foods: Food[] }>> = []

  requests.push(
    graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_USER_FOODS, {
      pattern,
      limit: userLimit,
    }),
  )

  if (trimmed.length >= OFF_CATALOG_DB_MIN_LENGTH) {
    requests.push(
      graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_OFF_FOODS, {
        pattern,
        limit: offLimit,
      }),
    )
  }

  const responses = await Promise.all(requests)
  const userFoods = responses[0]?.foods ?? []
  let offFoods = responses[1]?.foods ?? []

  if (
    mode === 'prefix' &&
    trimmed.length >= OFF_CATALOG_DB_MIN_LENGTH &&
    offFoods.length < OFF_CATALOG_FALLBACK_MIN_RESULTS
  ) {
    const fallback = await graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_OFF_FOODS, {
      pattern: buildFoodSearchContainsPattern(trimmed),
      limit: offLimit,
    })
    offFoods = mergeFoodSearchResults([], [...offFoods, ...fallback.foods], offLimit)
  }

  let results = mergeFoodSearchResults(userFoods, offFoods, totalLimit)

  if (tokens.length >= 2 && !hasRelevantFoodMatches(results, trimmed, tokens)) {
    const [tokenUserFoods, tokenOffFoods] = await Promise.all([
      searchFoodsByTokens(nhost, tokens, 'user', userLimit),
      trimmed.length >= OFF_CATALOG_DB_MIN_LENGTH
        ? searchFoodsByTokens(nhost, tokens, 'off', offLimit)
        : Promise.resolve([]),
    ])

    results = mergeFoodSearchResults(
      mergeFoodSearchResults(results, tokenUserFoods, totalLimit),
      tokenOffFoods,
      totalLimit,
    )
  }

  return rankFoodSearchResults(results, trimmed, tokens).slice(0, totalLimit)
}
