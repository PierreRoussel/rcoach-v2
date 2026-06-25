import { useQuery } from '@tanstack/react-query'

import { LIST_FREQUENT_FOODS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import type { Food } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useFrequentFoods(limit = 8) {
  const { nhost, isAuthenticated } = useAuth()
  const since = addDays(toDateKey(new Date()), -30)

  return useQuery({
    queryKey: ['frequent-foods', since],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{
        meal_log_entries: Array<{ food_id: string; food: Food }>
      }>(nhost, LIST_FREQUENT_FOODS, { since })

      const counts = new Map<string, { food: Food; count: number }>()

      for (const entry of data.meal_log_entries) {
        const current = counts.get(entry.food_id)
        if (current) {
          current.count += 1
        } else {
          counts.set(entry.food_id, { food: entry.food, count: 1 })
        }
      }

      return Array.from(counts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item) => item.food)
    },
  })
}
