import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'

import { buildNutritionDaySummary, type NutritionDaySummary } from '@/hooks/useNutritionDay'
import {
  fetchNutritionDayEntries,
  fetchNutritionHintRangeEntries,
  getHintWindowDates,
  groupEntriesByDate,
  nutritionDayQueryKey,
  nutritionHintsRangeQueryKey,
} from '@/lib/nutrition/fetch-nutrition-day-entries'
import {
  buildNutritionHintMetrics,
  countCachedWindowEntries,
} from '@/lib/nutrition/nutrition-hint-metrics'
import { isNutritionHintVisible, pickNutritionHint } from '@/lib/nutrition/nutrition-hints'
import type { MealLogEntry, NutritionSettings } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function nutritionHintsQueryKey(anchorDate: string) {
  return ['nutrition-hints', anchorDate] as const
}

function getCachedEntries(
  queryClient: ReturnType<typeof useQueryClient>,
  date: string,
): MealLogEntry[] | undefined {
  const cached = queryClient.getQueryData<NutritionDaySummary>(nutritionDayQueryKey(date))
  return cached?.entries
}

async function ensureWindowEntries(
  queryClient: ReturnType<typeof useQueryClient>,
  nhost: ReturnType<typeof useAuth>['nhost'],
  anchorDate: string,
  settings: NutritionSettings,
) {
  const windowDates = getHintWindowDates(anchorDate)
  const missingDates = windowDates.filter((date) => getCachedEntries(queryClient, date) == null)

  if (missingDates.length === 0) {
    return windowDates.flatMap((date) => getCachedEntries(queryClient, date) ?? [])
  }

  if (missingDates.length === 1) {
    const date = missingDates[0]!
    await queryClient.fetchQuery({
      queryKey: nutritionDayQueryKey(date),
      queryFn: async () => {
        const entries = await fetchNutritionDayEntries(nhost, date)
        return buildNutritionDaySummary(date, entries, settings)
      },
      staleTime: 60_000,
    })
  } else {
    const from = windowDates[0]!
    const to = windowDates[windowDates.length - 1]!

    await queryClient.fetchQuery({
      queryKey: nutritionHintsRangeQueryKey(from, to),
      queryFn: async () => {
        const entries = await fetchNutritionHintRangeEntries(nhost, from, to)
        const byDate = groupEntriesByDate(entries)

        for (const date of windowDates) {
          const dayEntries = byDate.get(date) ?? []
          queryClient.setQueryData(
            nutritionDayQueryKey(date),
            buildNutritionDaySummary(date, dayEntries, settings),
          )
        }

        return entries
      },
      staleTime: 60_000,
    })
  }

  return windowDates.flatMap((date) => getCachedEntries(queryClient, date) ?? [])
}

function getNutritionDayCacheRevision(
  queryClient: ReturnType<typeof useQueryClient>,
  dates: string[],
) {
  return dates
    .map((date) => {
      const summary = queryClient.getQueryData<NutritionDaySummary>(nutritionDayQueryKey(date))
      if (!summary) {
        return `${date}:missing`
      }

      return `${date}:${summary.entries.length}:${summary.totals.calories}`
    })
    .join('|')
}

function useNutritionDayCacheRevision(dates: string[]) {
  const queryClient = useQueryClient()

  return useSyncExternalStore(
    (onStoreChange) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryKey[0] === 'nutrition-day') {
          onStoreChange()
        }
      }),
    () => getNutritionDayCacheRevision(queryClient, dates),
    () => getNutritionDayCacheRevision(queryClient, dates),
  )
}

export function useNutritionHintAvailability(
  anchorDate: string,
  settings: NutritionSettings | null | undefined,
) {
  const queryClient = useQueryClient()
  const windowDates = useMemo(() => getHintWindowDates(anchorDate), [anchorDate])
  const cacheRevision = useNutritionDayCacheRevision(windowDates)

  return useMemo(() => {
    if (!settings) {
      return { hasActionableHint: false as const, hintId: null }
    }

    const cachedEntryCount = countCachedWindowEntries(windowDates, (date) =>
      getCachedEntries(queryClient, date),
    )

    if (cachedEntryCount === 0) {
      return { hasActionableHint: false as const, hintId: null }
    }

    const entries = windowDates.flatMap((date) => getCachedEntries(queryClient, date) ?? [])
    const byDate = groupEntriesByDate(entries)
    const metrics = buildNutritionHintMetrics(anchorDate, byDate, settings)
    const hint = pickNutritionHint(metrics)

    return {
      hasActionableHint: isNutritionHintVisible(metrics, hint.id),
      hintId: hint.id,
    }
    // cacheRevision drives recompute when nutrition-day cache updates
  }, [anchorDate, cacheRevision, queryClient, settings, windowDates])
}

export function useNutritionHints(
  anchorDate: string,
  settings: NutritionSettings | null | undefined,
  open: boolean,
) {
  const { nhost, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const windowDates = useMemo(() => getHintWindowDates(anchorDate), [anchorDate])
  const cacheRevision = useNutritionDayCacheRevision(windowDates)

  return useQuery({
    queryKey: [...nutritionHintsQueryKey(anchorDate), cacheRevision] as const,
    enabled: open && isAuthenticated && Boolean(settings),
    staleTime: 60_000,
    queryFn: async () => {
      const entries = await ensureWindowEntries(queryClient, nhost, anchorDate, settings!)
      const byDate = groupEntriesByDate(entries)
      const metrics = buildNutritionHintMetrics(anchorDate, byDate, settings!)
      const hint = pickNutritionHint(metrics)

      return {
        metrics,
        hint,
      }
    },
  })
}
