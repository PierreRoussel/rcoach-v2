import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { SEARCH_MY_FOODS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { cacheFood, searchCachedFoods } from '@/lib/nutrition/offline-food'
import { resolveOffDraftFromBarcode } from '@/lib/nutrition/off-product-lookup'
import {
  OFF_MIN_QUERY_LENGTH,
  searchOffProducts,
  type OffFoodDraft,
} from '@/lib/nutrition/open-food-facts'
import type { Food } from '@/lib/nutrition/types'
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

function isBarcodeQuery(query: string) {
  return /^\d{8,14}$/.test(query.trim())
}

export function useFoodSearch(
  query: string,
  enabled = true,
  options: FoodSearchOptions = {},
) {
  const { nhost, isAuthenticated } = useAuth()
  const isOnline = useOnlineStatus()
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const trimmed = debouncedQuery.trim()
  const searchOffExternally = options.searchOffExternally ?? false
  const isDebouncing =
    enabled && query.trim() !== trimmed && query.trim().length >= 2
  const isBarcode = isBarcodeQuery(trimmed)
  const offSearchEnabled =
    !isBarcode &&
    isOnline &&
    (trimmed.length >= OFF_MIN_QUERY_LENGTH ||
      (searchOffExternally && trimmed.length >= 2))

  const dbQuery = useQuery({
    queryKey: ['food-search-db', trimmed],
    enabled: isAuthenticated && enabled && trimmed.length >= 2 && !isBarcode,
    queryFn: async () => {
      try {
        const data = await graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_MY_FOODS, {
          query: `%${trimmed}%`,
          limit: 20,
        })

        for (const food of data.foods) {
          await cacheFood(food)
        }

        return data.foods
      } catch {
        return searchCachedFoods(trimmed, 20)
      }
    },
  })

  const barcodeQuery = useQuery({
    queryKey: ['food-search-barcode', trimmed],
    enabled: enabled && isBarcode && isOnline,
    queryFn: async () => {
      const draft = await resolveOffDraftFromBarcode(nhost, trimmed)
      return draft ? [draft] : []
    },
    staleTime: 60_000,
    retry: false,
  })

  const offQuery = useQuery({
    queryKey: ['food-search-off', trimmed, searchOffExternally],
    enabled: enabled && offSearchEnabled,
    queryFn: async () => searchOffProducts(trimmed, 15),
    staleTime: 60_000,
    retry: false,
  })

  const results = useMemo(() => {
    const merged = new Map<string, FoodSearchResult>()

    for (const food of dbQuery.data ?? []) {
      const key = food.off_product_id ?? food.id
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

    return Array.from(merged.values())
  }, [barcodeQuery.data, dbQuery.data, isBarcode, offQuery.data])

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
      trimmed.length >= 2 &&
      trimmed.length < OFF_MIN_QUERY_LENGTH,
    error: dbQuery.error,
  }
}

export { OFF_MIN_QUERY_LENGTH }
