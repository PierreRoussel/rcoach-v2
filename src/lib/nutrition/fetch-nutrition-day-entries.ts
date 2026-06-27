import type { NhostClient } from '@nhost/nhost-js'

import {
  LIST_MEAL_LOG_ENTRIES_FOR_DATE,
  LIST_MEAL_LOG_ENTRIES_FOR_HINTS,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { db, type NutritionDayCache } from '@/lib/db/dexie'
import { addDays } from '@/lib/nutrition/dates'
import { nutritionDayCacheId } from '@/lib/nutrition/nutrition-day-cache-id'
import type { MealLogEntry } from '@/lib/nutrition/types'

export {
  nutritionDayQueryKey,
  nutritionHintsQueryKey,
  nutritionHintsRangeQueryKey,
} from '@/lib/nutrition/nutrition-day-cache-id'

export function getHintWindowDates(anchorDate: string) {
  return [addDays(anchorDate, -2), addDays(anchorDate, -1), anchorDate]
}

function ownMealLogEntries<T extends { user_id?: string }>(
  entries: T[],
  userId: string,
): T[] {
  return entries.filter((entry) => entry.user_id === userId)
}

async function mergeDexiePendingEntries(
  userId: string,
  date: string,
  entries: MealLogEntry[],
) {
  const cached = await db.nutritionDayCache.get(nutritionDayCacheId(userId, date))
  if (!cached?.entries.length) {
    return entries
  }

  const knownIds = new Set(entries.map((entry) => entry.id))
  const merged = [...entries]

  for (const pendingEntry of cached.entries) {
    if (!pendingEntry.pending || knownIds.has(pendingEntry.id)) {
      continue
    }

    merged.push(pendingEntry as unknown as MealLogEntry)
  }

  return merged
}

async function persistEntriesToDexie(
  userId: string,
  date: string,
  entries: MealLogEntry[],
) {
  await db.nutritionDayCache.put({
    id: nutritionDayCacheId(userId, date),
    userId,
    date,
    entries: entries as unknown as NutritionDayCache['entries'],
    updatedAt: new Date().toISOString(),
  })
}

export async function fetchNutritionDayEntries(
  nhost: NhostClient,
  userId: string,
  date: string,
): Promise<MealLogEntry[]> {
  let entries: MealLogEntry[] = []

  try {
    const data = await graphqlRequest<{
      meal_log_entries: MealLogEntry[]
    }>(nhost, LIST_MEAL_LOG_ENTRIES_FOR_DATE, { date, userId })
    entries = ownMealLogEntries(data.meal_log_entries, userId)
  } catch {
    const cached = await db.nutritionDayCache.get(nutritionDayCacheId(userId, date))
    if (cached) {
      entries = cached.entries as unknown as MealLogEntry[]
    }
  }

  entries = await mergeDexiePendingEntries(userId, date, entries)
  await persistEntriesToDexie(userId, date, entries)
  return entries
}

export async function fetchNutritionHintRangeEntries(
  nhost: NhostClient,
  userId: string,
  from: string,
  to: string,
): Promise<MealLogEntry[]> {
  try {
    const data = await graphqlRequest<{
      meal_log_entries: MealLogEntry[]
    }>(nhost, LIST_MEAL_LOG_ENTRIES_FOR_HINTS, { from, to, userId })

    const byDate = new Map<string, MealLogEntry[]>()
    for (const entry of ownMealLogEntries(data.meal_log_entries, userId)) {
      const bucket = byDate.get(entry.logged_date) ?? []
      bucket.push(entry)
      byDate.set(entry.logged_date, bucket)
    }

    const allEntries: MealLogEntry[] = []
    for (const [date, dateEntries] of byDate) {
      const merged = await mergeDexiePendingEntries(userId, date, dateEntries)
      await persistEntriesToDexie(userId, date, merged)
      allEntries.push(...merged)
    }

    return allEntries
  } catch {
    const dates = getHintWindowDates(to)
    const offlineEntries: MealLogEntry[] = []

    for (const date of dates) {
      if (date < from || date > to) {
        continue
      }

      const cached = await db.nutritionDayCache.get(nutritionDayCacheId(userId, date))
      if (cached) {
        offlineEntries.push(...(cached.entries as unknown as MealLogEntry[]))
      }
    }

    return offlineEntries
  }
}

export function groupEntriesByDate(entries: MealLogEntry[]) {
  const byDate = new Map<string, MealLogEntry[]>()

  for (const entry of entries) {
    const bucket = byDate.get(entry.logged_date) ?? []
    bucket.push(entry)
    byDate.set(entry.logged_date, bucket)
  }

  return byDate
}
