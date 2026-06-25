import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  DELETE_FOOD_FAVORITE,
  GET_FOOD_BY_OFF_ID,
  INSERT_FOOD,
  INSERT_FOOD_FAVORITE,
  LIST_FOOD_FAVORITES,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  getOffProductByBarcode,
  mapOffDraftToFoodInsert,
  type OffFoodDraft,
} from '@/lib/nutrition/open-food-facts'
import type { Food } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { syncFoodUpsert } from '@/lib/graphql/nutrition-sync-queue'

export function useFoodFavorites() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['food-favorites'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{
        food_favorites: Array<{
          id: string
          food_id: string
          created_at: string
          food: Food
        }>
      }>(nhost, LIST_FOOD_FAVORITES)
      return data.food_favorites
    },
  })
}

export function useFoodFavoriteMutations() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  const toggleFavorite = useMutation({
    mutationFn: async (input: { foodId: string; favoriteId?: string }) => {
      if (input.favoriteId) {
        await graphqlRequest(nhost, DELETE_FOOD_FAVORITE, { id: input.favoriteId })
        return null
      }

      const data = await graphqlRequest<{
        insert_food_favorites_one: { id: string }
      }>(nhost, INSERT_FOOD_FAVORITE, { foodId: input.foodId })
      return data.insert_food_favorites_one
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['food-favorites'] })
    },
  })

  return { toggleFavorite }
}

export function useFoodMutations() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  const createFood = useMutation({
    mutationFn: async (object: Record<string, unknown>) => {
      try {
        const data = await graphqlRequest<{ insert_foods_one: Food }>(nhost, INSERT_FOOD, {
          object,
        })
        return data.insert_foods_one
      } catch {
        await syncFoodUpsert(nhost, object)
        throw new Error(
          'Aliment enregistré localement. Synchronisation à la reconnexion.',
        )
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['food-search-db'] })
    },
  })

  const ensureOffFood = async (draft: OffFoodDraft) => {
    const existing = await graphqlRequest<{ foods: Food[] }>(nhost, GET_FOOD_BY_OFF_ID, {
      offProductId: draft.offProductId,
    })

    if (existing.foods[0]) {
      return existing.foods[0]
    }

    const data = await graphqlRequest<{ insert_foods_one: Food }>(nhost, INSERT_FOOD, {
      object: mapOffDraftToFoodInsert(draft),
    })

    return data.insert_foods_one
  }

  const lookupBarcode = async (barcode: string) => {
    const draft = await getOffProductByBarcode(barcode)
    if (!draft) {
      return null
    }

    return ensureOffFood(draft)
  }

  return { createFood, ensureOffFood, lookupBarcode }
}
