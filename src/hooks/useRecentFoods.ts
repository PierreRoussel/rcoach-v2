import { useQuery } from '@tanstack/react-query'

import { LIST_FREQUENT_FOODS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import type { Food } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useRecentFoods(limit = 20) {
  const { nhost, isAuthenticated } = useAuth()
  const since = addDays(toDateKey(new Date()), -30)

  return useQuery({
    queryKey: ['recent-foods', since, limit],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{
        meal_log_entries: Array<{ food_id: string; food: Food }>
      }>(nhost, LIST_FREQUENT_FOODS, { since })

      const seen = new Set<string>()
      const foods: Food[] = []

      for (const entry of data.meal_log_entries) {
        if (!entry.food_id || !entry.food) {
          continue
        }

        if (seen.has(entry.food_id)) {
          continue
        }

        seen.add(entry.food_id)
        foods.push(entry.food)

        if (foods.length >= limit) {
          break
        }
      }

      return foods
    },
  })
}
