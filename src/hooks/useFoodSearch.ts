import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cacheFood, searchCachedFoods } from '@/lib/nutrition/offline-food'
import { resolveOffDraftFromBarcode } from '@/lib/nutrition/off-product-lookup'
import {
  OFF_CATALOG_DB_MIN_LENGTH,
  searchFoodsInDatabase,
  USER_FOOD_SEARCH_MIN_LENGTH,
} from '@/lib/nutrition/food-search'
import {
  buildFoodSearchHaystack,
  extractFoodSearchTokens,
  scoreCiqualFoodMatch,
  scoreFoodSearchMatch,
  sortFoodSearchByRelevance,
} from '@/lib/nutrition/food-search-tokens'
import {
  OFF_MIN_QUERY_LENGTH,
  searchOffProducts,
  type OffFoodDraft,
} from '@/lib/nutrition/open-food-facts'
import type { Food } from '@/lib/nutrition/types'
import type { PortionInput } from '@/lib/nutrition/nutrient-math'
import { useAuth } from '@/lib/nhost/AuthProvider'

export type FoodSearchResult = {
  id: string
  name: string
  brand: string | null
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  servingSizeG: number
  servingLabel: string
  source: Food['source'] | 'open_food_facts_live'
  barcode?: string | null
  offProductId?: string | null
  food?: Food
  offDraft?: OffFoodDraft
  quickAddPortion?: PortionInput
}

export type FoodSearchOptions = {
  searchOffExternally?: boolean
}

function mapDbFood(food: Food): FoodSearchResult {
  return {
    id: food.id,
    name: food.name,
    brand: food.brand,
    calories: Number(food.calories),
    carbsG: Number(food.carbs_g),
    proteinG: Number(food.protein_g),
    fatG: Number(food.fat_g),
    servingSizeG: Number(food.serving_size_g),
    servingLabel: food.serving_label,
    source: food.source,
    barcode: food.barcode,
    offProductId: food.off_product_id,
    food,
  }
}

const SEARCH_DEBOUNCE_MS = 700
const DB_SEARCH_STALE_MS = 60_000

function isBarcodeQuery(query: string) {
  return /^\d{8,14}$/.test(query.trim())
}

export function useFoodSearch(
  query: string,
  enabled = true,
  options: FoodSearchOptions = {},
) {
  const { nhost, isAuthenticated, user } = useAuth()
  const isOnline = useOnlineStatus()
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const trimmed = debouncedQuery.trim()
  const searchOffExternally = options.searchOffExternally ?? false
  const isDebouncing =
    enabled && query.trim() !== trimmed && query.trim().length >= USER_FOOD_SEARCH_MIN_LENGTH
  const isBarcode = isBarcodeQuery(trimmed)
  const dbSearchEnabled =
    isAuthenticated && enabled && trimmed.length >= USER_FOOD_SEARCH_MIN_LENGTH && !isBarcode

  const dbQuery = useQuery({
    queryKey: ['food-search-db', trimmed],
    enabled: dbSearchEnabled,
    queryFn: async () => {
      try {
        const foods = await searchFoodsInDatabase(nhost, trimmed, {
          userId: user?.id,
        })

        for (const food of foods) {
          await cacheFood(food)
        }

        return foods
      } catch {
        return searchCachedFoods(trimmed, 25)
      }
    },
    staleTime: DB_SEARCH_STALE_MS,
    retry: false,
  })

  const offSearchEnabled =
    !isBarcode &&
    isOnline &&
    trimmed.length >= USER_FOOD_SEARCH_MIN_LENGTH &&
    (searchOffExternally ||
      (dbQuery.isSuccess &&
        (dbQuery.data?.length ?? 0) === 0 &&
        trimmed.length >= OFF_MIN_QUERY_LENGTH))

  const barcodeQuery = useQuery({
    queryKey: ['food-search-barcode', trimmed],
    enabled: enabled && isBarcode && isOnline,
    queryFn: async () => {
      const draft = await resolveOffDraftFromBarcode(nhost, trimmed)
      return draft ? [draft] : []
    },
    staleTime: DB_SEARCH_STALE_MS,
    retry: false,
  })

  const offQuery = useQuery({
    queryKey: ['food-search-off', trimmed, searchOffExternally],
    enabled: enabled && offSearchEnabled,
    queryFn: async () => searchOffProducts(trimmed, 15),
    staleTime: DB_SEARCH_STALE_MS,
    retry: false,
  })

  const results = useMemo(() => {
    const merged = new Map<string, FoodSearchResult>()
    const tokens = extractFoodSearchTokens(trimmed)

    for (const food of dbQuery.data ?? []) {
      const key = food.ciqual_code
        ? `ciqual:${food.ciqual_code}`
        : (food.off_product_id ?? food.id)
      merged.set(key, mapDbFood(food))
    }

    const offDrafts = isBarcode ? (barcodeQuery.data ?? []) : (offQuery.data ?? [])

    for (const draft of offDrafts) {
      if (merged.has(draft.offProductId)) {
        continue
      }

      merged.set(draft.offProductId, {
        id: `off:${draft.offProductId}`,
        name: draft.name,
        brand: draft.brand,
        calories: draft.calories,
        carbsG: draft.carbsG,
        proteinG: draft.proteinG,
        fatG: draft.fatG,
        servingSizeG: draft.servingSizeG,
        servingLabel: draft.servingLabel,
        source: 'open_food_facts_live',
        barcode: draft.barcode,
        offProductId: draft.offProductId,
        offDraft: draft,
      })
    }

    return sortFoodSearchByRelevance(
      Array.from(merged.values()),
      trimmed,
      tokens,
      (result) => buildFoodSearchHaystack(result.name, result.brand, result.barcode),
      (result, haystack) =>
        result.source === 'ciqual'
          ? scoreCiqualFoodMatch(result.name, trimmed, tokens)
          : scoreFoodSearchMatch(haystack, trimmed, tokens),
    )
  }, [barcodeQuery.data, dbQuery.data, isBarcode, offQuery.data, trimmed])

  return {
    results,
    isLoading:
      isDebouncing ||
      dbQuery.isLoading ||
      offQuery.isLoading ||
      barcodeQuery.isLoading,
    isFetching:
      isDebouncing ||
      dbQuery.isFetching ||
      offQuery.isFetching ||
      barcodeQuery.isFetching,
    offSearchEnabled,
    canTriggerOffSearch:
      enabled &&
      !isBarcode &&
      isOnline &&
      trimmed.length >= USER_FOOD_SEARCH_MIN_LENGTH &&
      trimmed.length < OFF_MIN_QUERY_LENGTH,
    catalogSearchEnabled: trimmed.length >= OFF_CATALOG_DB_MIN_LENGTH,
    hasSearchedLocalCatalog: dbQuery.isSuccess,
    error: dbQuery.error,
  }
}

export { OFF_MIN_QUERY_LENGTH, OFF_CATALOG_DB_MIN_LENGTH, USER_FOOD_SEARCH_MIN_LENGTH }
