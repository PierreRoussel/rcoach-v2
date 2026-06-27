import { db } from '@/lib/db/dexie'

const NUTRITION_SYNC_TYPES = new Set([
  'insert_meal_entry',
  'update_meal_entry',
  'delete_meal_entry',
  'upsert_food',
])

export async function clearNutritionOfflineData() {
  await db.nutritionDayCache.clear()

  const pending = await db.syncQueue.toArray()
  await Promise.all(
    pending
      .filter((item) => NUTRITION_SYNC_TYPES.has(item.type))
      .map((item) => (item.id != null ? db.syncQueue.delete(item.id) : Promise.resolve())),
  )
}
