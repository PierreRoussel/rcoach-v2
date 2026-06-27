import { useMemo } from 'react'

import { useMealLogFoodEntries } from '@/hooks/useMealLogFoodEntries'
import type { Food } from '@/lib/nutrition/types'

export function useRecentFoods(limit = 20, options?: { enabled?: boolean }) {
  const query = useMealLogFoodEntries(options)

  const data = useMemo(() => {
    const seen = new Set<string>()
    const foods: Food[] = []

    for (const entry of query.data ?? []) {
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
  }, [query.data, limit])

  return {
    ...query,
    data,
  }
}
