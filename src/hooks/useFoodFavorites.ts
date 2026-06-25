import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  DELETE_FOOD_FAVORITE,
  GET_FOOD_BY_OFF_ID,
  INSERT_FOOD,
  INSERT_FOOD_FAVORITE,
  LIST_FOOD_FAVORITES,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { cacheFood } from '@/lib/nutrition/offline-food'
import type { Food } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { syncFoodUpsert } from '@/lib/graphql/nutrition-sync-queue'
import {
  getOffProductByBarcode,
  mapOffDraftToFoodInsert,
  type OffFoodDraft,
} from '@/lib/nutrition/open-food-facts'

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
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  function withFoodInsertIdentity(object: Record<string, unknown>) {
    if (object.source === 'open_food_facts') {
      return object
    }

    if (!user?.id) {
      throw new Error('Utilisateur non connecte.')
    }

    return {
      ...object,
      source: 'user',
      user_id: user.id,
    }
  }

  const createFood = useMutation({
    mutationFn: async (object: Record<string, unknown>) => {
      const payload = withFoodInsertIdentity(object)

      try {
        const data = await graphqlRequest<{ insert_foods_one: Food }>(nhost, INSERT_FOOD, {
          object: payload,
        })
        await cacheFood(data.insert_foods_one)
        return data.insert_foods_one
      } catch {
        if (!user?.id) {
          throw new Error('Utilisateur non connecte.')
        }

        return syncFoodUpsert(nhost, payload, user.id)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['food-search-db'] })
    },
  })

  const ensureOffFood = async (draft: OffFoodDraft) => {
    try {
      const existing = await graphqlRequest<{ foods: Food[] }>(nhost, GET_FOOD_BY_OFF_ID, {
        offProductId: draft.offProductId,
      })

      if (existing.foods[0]) {
        await cacheFood(existing.foods[0])
        return existing.foods[0]
      }

      const data = await graphqlRequest<{ insert_foods_one: Food }>(nhost, INSERT_FOOD, {
        object: mapOffDraftToFoodInsert(draft),
      })

      await cacheFood(data.insert_foods_one)
      return data.insert_foods_one
    } catch {
      if (!user?.id) {
        throw new Error('Utilisateur non connecte.')
      }

      return syncFoodUpsert(nhost, mapOffDraftToFoodInsert(draft), user.id, draft.offProductId)
    }
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
