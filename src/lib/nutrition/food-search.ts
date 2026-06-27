import type { NhostClient } from '@nhost/nhost-js'

import {
  FOOD_SEARCH_FIELDS,
  SEARCH_CIQUAL_FOODS,
  SEARCH_OFF_CATALOG_FOODS,
  SEARCH_USER_FOODS,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  buildFoodSearchHaystack,
  extractFoodSearchTokens,
  matchesAllFoodSearchTokens,
  normalizeFoodSearchQuery,
  scoreCiqualFoodMatch,
  sortFoodSearchByRelevance,
  sortFoodSearchResultsGrouped,
} from '@/lib/nutrition/food-search-tokens'
import type { Food } from '@/lib/nutrition/types'

export const USER_FOOD_SEARCH_MIN_LENGTH = 2
export const OFF_CATALOG_DB_MIN_LENGTH = 3
export const OFF_CATALOG_CONTAINS_MIN_LENGTH = 5
export const OFF_CATALOG_FALLBACK_MIN_RESULTS = 12
export const CIQUAL_SEARCH_LIMIT = 3
export const OFF_CATALOG_SEARCH_LIMIT = 10

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

export function buildCiqualNamePrefixPattern(query: string) {
  const normalized = normalizeFoodSearchQuery(query)
  return normalized ? `${normalized}%` : '%'
}

function catalogFoodKey(food: Food) {
  if (food.ciqual_code) {
    return `ciqual:${food.ciqual_code}`
  }
  if (food.off_product_id) {
    return `off:${food.off_product_id}`
  }
  return food.id
}

function mergeFoodSearchLayers(layers: Food[][], limit: number) {
  const merged = new Map<string, Food>()

  for (const layer of layers) {
    for (const food of layer) {
      const key = food.user_id ? food.id : catalogFoodKey(food)
      if (!merged.has(key)) {
        merged.set(key, food)
      }
    }

    if (merged.size >= limit) {
      break
    }
  }

  return Array.from(merged.values()).slice(0, limit)
}

function buildTokenMatchCondition(variable: string) {
  return `{
              _or: [
                { name: { _ilike: ${variable} } }
                { brand: { _ilike: ${variable} } }
                { barcode: { _ilike: ${variable} } }
              ]
            }`
}

function buildTokenAndSearchQuery(tokens: string[], scope: 'user' | 'ciqual' | 'off') {
  const scopeVariable = scope === 'user' ? '$userId: uuid!, ' : ''
  const variableDefinitions = [
    scopeVariable,
    ...tokens.map((_, index) => `$token${index}: String!`),
    '$limit: Int!',
  ].join(', ')
  const tokenConditions = tokens
    .map((_, index) => buildTokenMatchCondition(`$token${index}`))
    .join('\n            ')
  const scopeCondition =
    scope === 'user'
      ? '{ user_id: { _eq: $userId } }'
      : scope === 'ciqual'
        ? '{ source: { _eq: ciqual } }'
        : '{ source: { _eq: open_food_facts } }'

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
  scope: 'user' | 'ciqual' | 'off',
  limit: number,
  userId?: string,
) {
  if (tokens.length === 0) {
    return []
  }

  if (scope === 'user' && !userId) {
    return []
  }

  const variables = {
    ...(scope === 'user' ? { userId } : {}),
    ...Object.fromEntries(
      tokens.map((token, index) => [
        `token${index}`,
        scope === 'ciqual' && index === 0 ? `${token}%` : `%${token}%`,
      ]),
    ),
    limit,
  }

  const response = await graphqlRequest<{ foods: Food[] }>(
    nhost,
    buildTokenAndSearchQuery(tokens, scope),
    variables,
  )

  return response.foods
}

function rankCiqualFoodSearchResults(foods: Food[], query: string, tokens: string[]) {
  return sortFoodSearchByRelevance(
    foods,
    query,
    tokens,
    (food) => buildFoodSearchHaystack(food.name, food.brand, food.barcode),
    (food) => scoreCiqualFoodMatch(food.name, query, tokens),
  )
}

function rankFoodSearchResults(foods: Food[], query: string, tokens: string[]) {
  return sortFoodSearchResultsGrouped(foods, query, tokens, (food) => ({
    source: food.source,
    name: food.name,
    brand: food.brand,
    barcode: food.barcode,
  }))
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

async function searchCiqualFoods(
  nhost: NhostClient,
  query: string,
  containsPattern: string,
  limit: number,
) {
  const response = await graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_CIQUAL_FOODS, {
    namePrefix: buildCiqualNamePrefixPattern(query),
    containsPattern,
    limit,
  })

  const tokens = extractFoodSearchTokens(query)
  return rankCiqualFoodSearchResults(response.foods, query, tokens).slice(0, limit)
}

async function searchCatalogFoods(
  nhost: NhostClient,
  query: string,
  containsPattern: string,
  ciqualLimit: number,
  offLimit: number,
) {
  const [ciqualFoods, offResponse] = await Promise.all([
    searchCiqualFoods(nhost, query, containsPattern, ciqualLimit),
    graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_OFF_CATALOG_FOODS, {
      pattern: containsPattern,
      limit: offLimit,
    }),
  ])

  return {
    ciqualFoods,
    offFoods: offResponse.foods,
  }
}

export async function searchFoodsInDatabase(
  nhost: NhostClient,
  query: string,
  options: {
    userId?: string
    userLimit?: number
    ciqualLimit?: number
    offLimit?: number
    catalogLimit?: number
    totalLimit?: number
  } = {},
) {
  const trimmed = query.trim()
  const userId = options.userId
  const userLimit = options.userLimit ?? 10
  const ciqualLimit = options.ciqualLimit ?? CIQUAL_SEARCH_LIMIT
  const offCatalogLimit =
    options.offLimit ?? options.catalogLimit ?? OFF_CATALOG_SEARCH_LIMIT
  const totalLimit = options.totalLimit ?? 25
  const tokens = extractFoodSearchTokens(trimmed)

  if (trimmed.length < USER_FOOD_SEARCH_MIN_LENGTH) {
    return []
  }

  const { pattern, mode } = buildFoodSearchPattern(trimmed)

  const userFoods = userId
    ? (
        await graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_USER_FOODS, {
          userId,
          pattern,
          limit: userLimit,
        })
      ).foods
    : []

  let ciqualFoods: Food[] = []
  let offFoods: Food[] = []

  if (trimmed.length >= OFF_CATALOG_DB_MIN_LENGTH) {
    const catalog = await searchCatalogFoods(
      nhost,
      trimmed,
      pattern,
      ciqualLimit,
      offCatalogLimit,
    )
    ciqualFoods = catalog.ciqualFoods
    offFoods = catalog.offFoods

    if (
      mode === 'prefix' &&
      ciqualFoods.length + offFoods.length < OFF_CATALOG_FALLBACK_MIN_RESULTS
    ) {
      const fallback = await searchCatalogFoods(
        nhost,
        trimmed,
        buildFoodSearchContainsPattern(trimmed),
        ciqualLimit,
        offCatalogLimit,
      )
      ciqualFoods = mergeFoodSearchLayers([ciqualFoods, fallback.ciqualFoods], ciqualLimit)
      offFoods = mergeFoodSearchLayers([offFoods, fallback.offFoods], offCatalogLimit)
    }
  }

  let results = mergeFoodSearchLayers([userFoods, ciqualFoods, offFoods], totalLimit)

  if (tokens.length >= 2 && !hasRelevantFoodMatches(results, trimmed, tokens)) {
    const [tokenUserFoods, tokenCiqualFoods, tokenOffFoods] = await Promise.all([
      searchFoodsByTokens(nhost, tokens, 'user', userLimit, userId),
      trimmed.length >= OFF_CATALOG_DB_MIN_LENGTH
        ? searchFoodsByTokens(nhost, tokens, 'ciqual', ciqualLimit).then((foods) =>
            rankCiqualFoodSearchResults(foods, trimmed, tokens).slice(0, ciqualLimit),
          )
        : Promise.resolve([]),
      trimmed.length >= OFF_CATALOG_DB_MIN_LENGTH
        ? searchFoodsByTokens(nhost, tokens, 'off', offCatalogLimit)
        : Promise.resolve([]),
    ])

    results = mergeFoodSearchLayers(
      [results, tokenUserFoods, tokenCiqualFoods, tokenOffFoods],
      totalLimit,
    )
  }

  return rankFoodSearchResults(results, trimmed, tokens).slice(0, totalLimit)
}
