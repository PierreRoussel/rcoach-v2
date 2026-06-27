import { useMemo } from 'react'

import { useMealLogFoodEntries } from '@/hooks/useMealLogFoodEntries'
import { buildFrequentFoods, type FrequentFood } from '@/lib/nutrition/frequent-portion'

export function useFrequentFoods(limit = 8, options?: { enabled?: boolean }) {
  const query = useMealLogFoodEntries(options)
  const data = useMemo(
    () => buildFrequentFoods(query.data ?? [], limit),
    [query.data, limit],
  )

  return {
    ...query,
    data,
  }
}

export type { FrequentFood }
