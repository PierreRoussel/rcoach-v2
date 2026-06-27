import { useQuery } from '@tanstack/react-query'

import { LIST_FREQUENT_FOODS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import type { Food } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

export type MealLogFoodEntry = {
  food_id: string | null
  quantity_g: number | null
  servings: number | null
  food: Food | null
}

export function useMealLogFoodEntries(options?: { enabled?: boolean }) {
  const { nhost, isAuthenticated } = useAuth()
  const since = addDays(toDateKey(new Date()), -30)

  return useQuery({
    queryKey: ['meal-log-foods', since],
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        meal_log_entries: MealLogFoodEntry[]
      }>(nhost, LIST_FREQUENT_FOODS, { since })

      return data.meal_log_entries
    },
  })
}
