import { useQuery } from '@tanstack/react-query'

import { db } from '@/lib/db/dexie'
import { useAuth } from '@/lib/nhost/AuthProvider'

const NUTRITION_QUEUE_TYPES = new Set([
  'insert_meal_entry',
  'update_meal_entry',
  'delete_meal_entry',
  'upsert_food',
])

export function usePendingNutritionSyncCount() {
  const { isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['nutrition-sync-pending', user?.id],
    enabled: isAuthenticated && Boolean(user?.id),
    queryFn: async () => {
      const pending = await db.syncQueue.toArray()
      return pending.filter((item) => NUTRITION_QUEUE_TYPES.has(item.type)).length
    },
    refetchInterval: 5000,
  })
}
