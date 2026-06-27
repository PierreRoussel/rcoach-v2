import type { NhostClient } from '@nhost/nhost-js'

import {
  LIST_MEAL_LOG_ENTRIES_FOR_DATE,
  LIST_MEAL_LOG_ENTRIES_FOR_HINTS,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { db, type NutritionDayCache } from '@/lib/db/dexie'
import { addDays } from '@/lib/nutrition/dates'
import type { MealLogEntry } from '@/lib/nutrition/types'

export function nutritionDayQueryKey(date: string) {
  return ['nutrition-day', date] as const
}

export function nutritionHintsRangeQueryKey(from: string, to: string) {
  return ['nutrition-hints-range', from, to] as const
}

export function getHintWindowDates(anchorDate: string) {
  return [addDays(anchorDate, -2), addDays(anchorDate, -1), anchorDate]
}

async function mergeDexiePendingEntries(date: string, entries: MealLogEntry[]) {
  const cached = await db.nutritionDayCache.get(date)
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

async function persistEntriesToDexie(date: string, entries: MealLogEntry[]) {
  await db.nutritionDayCache.put({
    date,
    entries: entries as unknown as NutritionDayCache['entries'],
    updatedAt: new Date().toISOString(),
  })
}

export async function fetchNutritionDayEntries(
  nhost: NhostClient,
  date: string,
): Promise<MealLogEntry[]> {
  let entries: MealLogEntry[] = []

  try {
    const data = await graphqlRequest<{
      meal_log_entries: MealLogEntry[]
    }>(nhost, LIST_MEAL_LOG_ENTRIES_FOR_DATE, { date })
    entries = data.meal_log_entries
  } catch {
    const cached = await db.nutritionDayCache.get(date)
    if (cached) {
      entries = cached.entries as unknown as MealLogEntry[]
    }
  }

  entries = await mergeDexiePendingEntries(date, entries)
  await persistEntriesToDexie(date, entries)
  return entries
}

export async function fetchNutritionHintRangeEntries(
  nhost: NhostClient,
  from: string,
  to: string,
): Promise<MealLogEntry[]> {
  try {
    const data = await graphqlRequest<{
      meal_log_entries: MealLogEntry[]
    }>(nhost, LIST_MEAL_LOG_ENTRIES_FOR_HINTS, { from, to })

    const byDate = new Map<string, MealLogEntry[]>()
    for (const entry of data.meal_log_entries) {
      const bucket = byDate.get(entry.logged_date) ?? []
      bucket.push(entry)
      byDate.set(entry.logged_date, bucket)
    }

    const allEntries: MealLogEntry[] = []
    for (const [date, dateEntries] of byDate) {
      const merged = await mergeDexiePendingEntries(date, dateEntries)
      await persistEntriesToDexie(date, merged)
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

      const cached = await db.nutritionDayCache.get(date)
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
