import { useQuery } from '@tanstack/react-query'

import { LIST_FREQUENT_FOODS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import { buildFrequentFoods, type FrequentFood } from '@/lib/nutrition/frequent-portion'
import type { Food } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useFrequentFoods(limit = 8) {
  const { nhost, isAuthenticated } = useAuth()
  const since = addDays(toDateKey(new Date()), -30)

  return useQuery({
    queryKey: ['frequent-foods', since, limit],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{
        meal_log_entries: Array<{
          food_id: string | null
          quantity_g: number | null
          servings: number | null
          food: Food | null
        }>
      }>(nhost, LIST_FREQUENT_FOODS, { since })

      return buildFrequentFoods(data.meal_log_entries, limit)
    },
  })
}

export type { FrequentFood }
