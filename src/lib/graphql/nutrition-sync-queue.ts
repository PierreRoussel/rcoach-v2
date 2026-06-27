import { db } from '@/lib/db/dexie'
import {
  DELETE_MEAL_LOG_ENTRY,
  INSERT_FOOD,
  INSERT_MEAL_LOG_ENTRY,
  UPDATE_MEAL_LOG_ENTRY,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { nutritionDayCacheId } from '@/lib/nutrition/nutrition-day-cache-id'
import {
  buildLocalFood,
  cacheFood,
  isLocalFoodId,
  toLocalFoodId,
  stripLocalFoodId,
} from '@/lib/nutrition/offline-food'
import type { Food } from '@/lib/nutrition/types'
import type { NhostClient } from '@nhost/nhost-js'

export type NutritionFlushResult = {
  syncedCount: number
  affectedDates: string[]
}

export async function enqueueNutritionMutation(
  type:
    | 'insert_meal_entry'
    | 'update_meal_entry'
    | 'delete_meal_entry'
    | 'upsert_food',
  payload: object,
) {
  await db.syncQueue.add({
    type,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    attempts: 0,
  })
}

export async function syncMealEntryInsert(
  _nhost: NhostClient,
  payload: {
    userId: string
    object: Record<string, unknown>
    food?: Food
    entryId?: string
  },
) {
  const localId = payload.entryId ?? crypto.randomUUID()
  await enqueueNutritionMutation('insert_meal_entry', {
    localId,
    object: payload.object,
  })
  await cacheMealEntryLocally(payload.userId, localId, payload.object, payload.food)
  return localId
}

export async function syncMealEntryUpdate(
  _nhost: NhostClient,
  id: string,
  changes: Record<string, unknown>,
) {
  await enqueueNutritionMutation('update_meal_entry', { id, changes })
  await updateCachedMealEntry(id, changes)
}

export async function syncMealEntryDelete(_nhost: NhostClient, id: string) {
  await enqueueNutritionMutation('delete_meal_entry', { id })
  await removeCachedMealEntry(id)
}

export async function removeMealEntryFromDayCache(id: string) {
  await removeCachedMealEntry(id)
}

export async function syncFoodUpsert(
  _nhost: NhostClient,
  object: Record<string, unknown>,
  userId: string,
  localId?: string,
) {
  const resolvedLocalId = localId ?? stripLocalFoodId(crypto.randomUUID())
  const localFood = buildLocalFood(object, userId, resolvedLocalId)
  await cacheFood(localFood)
  await enqueueNutritionMutation('upsert_food', {
    localId: resolvedLocalId,
    object,
  })
  return localFood
}

export async function flushNutritionSyncQueue(nhost: NhostClient): Promise<NutritionFlushResult> {
  const pending = await db.syncQueue.orderBy('createdAt').toArray()
  const foodIdMap = new Map<string, string>()
  let syncedCount = 0
  const affectedDates = new Set<string>()

  for (const item of pending) {
    if (item.type !== 'upsert_food') {
      continue
    }

    try {
      const payload = JSON.parse(item.payload) as {
        localId?: string
        object: Record<string, unknown>
      }

      const data = await graphqlRequest<{ insert_foods_one: Food }>(nhost, INSERT_FOOD, {
        object: payload.object,
      })

      if (payload.localId) {
        foodIdMap.set(toLocalFoodId(payload.localId), data.insert_foods_one.id)
        await db.foodsCache.delete(toLocalFoodId(payload.localId))
        await cacheFood(data.insert_foods_one)
      }

      if (item.id != null) {
        await db.syncQueue.delete(item.id)
      }

      syncedCount += 1
    } catch {
      if (item.id != null) {
        await db.syncQueue.update(item.id, { attempts: item.attempts + 1 })
      }
    }
  }

  for (const item of pending) {
    if (item.type === 'upsert_food') {
      continue
    }

    if (
      item.type !== 'insert_meal_entry' &&
      item.type !== 'update_meal_entry' &&
      item.type !== 'delete_meal_entry'
    ) {
      continue
    }

    try {
      const payload = JSON.parse(item.payload) as Record<string, unknown>

      if (item.type === 'insert_meal_entry') {
        const object = { ...(payload.object as Record<string, unknown>) }
        const foodId = String(object.food_id ?? '')
        if (isLocalFoodId(foodId) && foodIdMap.has(foodId)) {
          object.food_id = foodIdMap.get(foodId)
        }

        await graphqlRequest(nhost, INSERT_MEAL_LOG_ENTRY, { object })

        const date = String(object.logged_date ?? '')
        if (date) {
          affectedDates.add(date)
        }

        const localId = String(payload.localId ?? '')
        if (localId) {
          await removeCachedMealEntry(localId)
        }
      } else if (item.type === 'update_meal_entry') {
        await graphqlRequest(nhost, UPDATE_MEAL_LOG_ENTRY, {
          id: payload.id,
          changes: payload.changes,
        })
      } else if (item.type === 'delete_meal_entry') {
        await graphqlRequest(nhost, DELETE_MEAL_LOG_ENTRY, { id: payload.id })
      }

      if (item.id != null) {
        await db.syncQueue.delete(item.id)
      }

      syncedCount += 1
    } catch {
      if (item.id != null) {
        await db.syncQueue.update(item.id, { attempts: item.attempts + 1 })
      }
    }
  }

  return {
    syncedCount,
    affectedDates: Array.from(affectedDates),
  }
}

async function cacheMealEntryLocally(
  userId: string,
  localId: string,
  object: Record<string, unknown>,
  food?: Food,
) {
  const date = String(object.logged_date)
  const cacheId = nutritionDayCacheId(userId, date)
  const existing = await db.nutritionDayCache.get(cacheId)
  const entry = {
    id: localId,
    ...object,
    food: food ?? null,
    pending: true,
  }

  await db.nutritionDayCache.put({
    id: cacheId,
    userId,
    date,
    entries: [...(existing?.entries ?? []), entry],
    updatedAt: new Date().toISOString(),
  })
}

async function updateCachedMealEntry(id: string, changes: Record<string, unknown>) {
  const caches = await db.nutritionDayCache.toArray()

  for (const cache of caches) {
    const index = cache.entries.findIndex((entry) => entry.id === id)
    if (index === -1) {
      continue
    }

    const nextEntries = [...cache.entries]
    nextEntries[index] = { ...nextEntries[index], ...changes, pending: true }
    await db.nutritionDayCache.put({
      ...cache,
      entries: nextEntries,
      updatedAt: new Date().toISOString(),
    })
  }
}

async function removeCachedMealEntry(id: string) {
  const caches = await db.nutritionDayCache.toArray()

  for (const cache of caches) {
    const nextEntries = cache.entries.filter((entry) => entry.id !== id)
    if (nextEntries.length === cache.entries.length) {
      continue
    }

    await db.nutritionDayCache.put({
      ...cache,
      entries: nextEntries,
      updatedAt: new Date().toISOString(),
    })
  }
}
