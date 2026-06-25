import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { SEARCH_MY_FOODS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { searchOffProducts, type OffFoodDraft } from '@/lib/nutrition/open-food-facts'
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

export function useFoodSearch(query: string, enabled = true) {
  const { nhost, isAuthenticated } = useAuth()
  const trimmed = query.trim()

  const dbQuery = useQuery({
    queryKey: ['food-search-db', trimmed],
    enabled: isAuthenticated && enabled && trimmed.length >= 2,
    queryFn: async () => {
      const data = await graphqlRequest<{ foods: Food[] }>(nhost, SEARCH_MY_FOODS, {
        query: `%${trimmed}%`,
        limit: 20,
      })
      return data.foods
    },
  })

  const offQuery = useQuery({
    queryKey: ['food-search-off', trimmed],
    enabled: enabled && trimmed.length >= 2,
    queryFn: async () => searchOffProducts(trimmed, 15),
    staleTime: 60_000,
  })

  const results = useMemo(() => {
    const merged = new Map<string, FoodSearchResult>()

    for (const food of dbQuery.data ?? []) {
      const key = food.off_product_id ?? food.id
      merged.set(key, mapDbFood(food))
    }

    for (const draft of offQuery.data ?? []) {
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
  }, [dbQuery.data, offQuery.data])

  return {
    results,
    isLoading: dbQuery.isLoading || offQuery.isLoading,
    isFetching: dbQuery.isFetching || offQuery.isFetching,
    error: dbQuery.error ?? offQuery.error,
  }
}
