import { useMemo } from 'react'

import { useMealLogFoodEntries } from '@/hooks/useMealLogFoodEntries'
import { mealLogEntryToPortion } from '@/lib/nutrition/frequent-portion'
import type { PortionInput } from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

export type RecentFood = {
  food: Food
  portion: PortionInput
}

export function useRecentFoods(limit = 20, options?: { enabled?: boolean }) {
  const query = useMealLogFoodEntries(options)

  const data = useMemo(() => {
    const seen = new Set<string>()
    const foods: RecentFood[] = []

    for (const entry of query.data ?? []) {
      if (!entry.food_id || !entry.food) {
        continue
      }

      if (seen.has(entry.food_id)) {
        continue
      }

      seen.add(entry.food_id)
      foods.push({
        food: entry.food,
        portion: mealLogEntryToPortion(entry),
      })

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
