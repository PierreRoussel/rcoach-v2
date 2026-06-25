import { db } from '@/lib/db/dexie'
import {
  DELETE_MEAL_LOG_ENTRY,
  INSERT_FOOD,
  INSERT_MEAL_LOG_ENTRY,
  UPDATE_MEAL_LOG_ENTRY,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import type { NhostClient } from '@nhost/nhost-js'

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
  payload: { object: Record<string, unknown>; food?: Record<string, unknown> },
) {
  const localId = crypto.randomUUID()
  await enqueueNutritionMutation('insert_meal_entry', {
    localId,
    object: payload.object,
  })
  await cacheMealEntryLocally(localId, payload.object, payload.food)
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
  await removeMealEntryFromDayCache(id)
}

export async function removeMealEntryFromDayCache(id: string) {
  await removeCachedMealEntry(id)
}

export async function syncFoodUpsert(_nhost: NhostClient, object: Record<string, unknown>) {
  await enqueueNutritionMutation('upsert_food', { object })
}

export async function flushNutritionSyncQueue(nhost: NhostClient) {
  const pending = await db.syncQueue.orderBy('createdAt').toArray()

  for (const item of pending) {
    if (
      item.type !== 'insert_meal_entry' &&
      item.type !== 'update_meal_entry' &&
      item.type !== 'delete_meal_entry' &&
      item.type !== 'upsert_food'
    ) {
      continue
    }

    try {
      const payload = JSON.parse(item.payload) as Record<string, unknown>

      if (item.type === 'insert_meal_entry') {
        await graphqlRequest(nhost, INSERT_MEAL_LOG_ENTRY, {
          object: payload.object,
        })
      } else if (item.type === 'update_meal_entry') {
        await graphqlRequest(nhost, UPDATE_MEAL_LOG_ENTRY, {
          id: payload.id,
          changes: payload.changes,
        })
      } else if (item.type === 'delete_meal_entry') {
        await graphqlRequest(nhost, DELETE_MEAL_LOG_ENTRY, { id: payload.id })
      } else if (item.type === 'upsert_food') {
        await graphqlRequest(nhost, INSERT_FOOD, { object: payload.object })
      }

      if (item.id != null) {
        await db.syncQueue.delete(item.id)
      }
    } catch {
      if (item.id != null) {
        await db.syncQueue.update(item.id, { attempts: item.attempts + 1 })
      }
    }
  }
}

async function cacheMealEntryLocally(
  localId: string,
  object: Record<string, unknown>,
  food?: Record<string, unknown>,
) {
  const date = String(object.logged_date)
  const existing = await db.nutritionDayCache.get(date)
  const entry = {
    id: localId,
    ...object,
    food: food ?? null,
    pending: true,
  }

  await db.nutritionDayCache.put({
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
