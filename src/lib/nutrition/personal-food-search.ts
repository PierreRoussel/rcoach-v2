import {
  buildFoodSearchHaystack,
  extractFoodSearchTokens,
  matchesAllFoodSearchTokens,
  normalizeFoodSearchQuery,
  scoreFoodSearchMatch,
} from '@/lib/nutrition/food-search-tokens'
import { mapFoodToSearchResult, type FoodSearchResult } from '@/lib/nutrition/food-search-result'
import type { PortionInput } from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

export type PersonalFoodUsageBadge = 'recent' | 'frequent'

export type PersonalFoodSearchCandidate = {
  food: Food
  portion?: PortionInput
  badge: PersonalFoodUsageBadge
  rank: number
}

const PERSONAL_MATCH_MIN_SCORE = 6

export function isPersonalFoodSearchMatch(
  food: Pick<Food, 'name' | 'brand' | 'barcode'>,
  query: string,
  tokens = extractFoodSearchTokens(query),
) {
  const haystack = buildFoodSearchHaystack(food.name, food.brand, food.barcode)
  const normalizedQuery = normalizeFoodSearchQuery(query)

  if (tokens.length > 0) {
    if (!matchesAllFoodSearchTokens(haystack, tokens)) {
      return false
    }

    return scoreFoodSearchMatch(haystack, query, tokens) >= PERSONAL_MATCH_MIN_SCORE
  }

  return normalizedQuery.length >= 2 && haystack.includes(normalizedQuery)
}

export function buildPersonalFoodSearchCandidates(
  recentFoods: Array<{ food: Food; portion: PortionInput }>,
  frequentFoods: Array<{ food: Food; portion: PortionInput }>,
): PersonalFoodSearchCandidate[] {
  const candidates: PersonalFoodSearchCandidate[] = []
  const seenFoodIds = new Set<string>()

  recentFoods.forEach((item, index) => {
    seenFoodIds.add(item.food.id)
    candidates.push({
      food: item.food,
      portion: item.portion,
      badge: 'recent',
      rank: index,
    })
  })

  frequentFoods.forEach((item, index) => {
    if (seenFoodIds.has(item.food.id)) {
      return
    }

    candidates.push({
      food: item.food,
      portion: item.portion,
      badge: 'frequent',
      rank: 1_000 + index,
    })
  })

  return candidates
}

export function mergePersonalFoodsIntoSearchResults(
  results: FoodSearchResult[],
  query: string,
  candidates: PersonalFoodSearchCandidate[],
): FoodSearchResult[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length < 2 || candidates.length === 0) {
    return results
  }

  const tokens = extractFoodSearchTokens(trimmedQuery)
  const matchingPersonal = candidates
    .filter((candidate) => isPersonalFoodSearchMatch(candidate.food, trimmedQuery, tokens))
    .map((candidate) => {
      const haystack = buildFoodSearchHaystack(
        candidate.food.name,
        candidate.food.brand,
        candidate.food.barcode,
      )

      return {
        candidate,
        score: scoreFoodSearchMatch(haystack, trimmedQuery, tokens),
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.candidate.rank - right.candidate.rank
    })

  if (matchingPersonal.length === 0) {
    return results
  }

  const seenIds = new Set<string>()
  const merged: FoodSearchResult[] = []

  for (const { candidate } of matchingPersonal) {
    if (seenIds.has(candidate.food.id)) {
      continue
    }

    seenIds.add(candidate.food.id)
    merged.push({
      ...mapFoodToSearchResult(candidate.food, candidate.portion),
      usageBadge: candidate.badge,
    })
  }

  for (const result of results) {
    const resultFoodId = result.food?.id ?? result.id

    if (seenIds.has(resultFoodId)) {
      continue
    }

    seenIds.add(resultFoodId)
    merged.push(result)
  }

  return merged
}
