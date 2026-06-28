import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'

import { buildNutritionDaySummary, type NutritionDaySummary } from '@/hooks/useNutritionDay'
import {
  fetchNutritionDayEntries,
  fetchNutritionHintRangeEntries,
  getHintWindowDates,
  groupEntriesByDate,
  nutritionDayQueryKey,
  nutritionHintsQueryKey,
  nutritionHintsRangeQueryKey,
} from '@/lib/nutrition/fetch-nutrition-day-entries'
import {
  buildNutritionHintMetrics,
  countCachedWindowEntries,
} from '@/lib/nutrition/nutrition-hint-metrics'
import { isNutritionHintVisible, pickNutritionHint } from '@/lib/nutrition/nutrition-hints'
import type { MealLogEntry, NutritionSettings } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

function getCachedEntries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  date: string,
): MealLogEntry[] | undefined {
  if (!userId) {
    return undefined
  }

  const cached = queryClient.getQueryData<NutritionDaySummary>(nutritionDayQueryKey(userId, date))
  return cached?.entries
}

async function ensureWindowEntries(
  queryClient: ReturnType<typeof useQueryClient>,
  nhost: ReturnType<typeof useAuth>['nhost'],
  userId: string,
  anchorDate: string,
  settings: NutritionSettings,
) {
  const windowDates = getHintWindowDates(anchorDate)
  const missingDates = windowDates.filter(
    (date) => getCachedEntries(queryClient, userId, date) == null,
  )

  if (missingDates.length === 0) {
    return windowDates.flatMap((date) => getCachedEntries(queryClient, userId, date) ?? [])
  }

  if (missingDates.length === 1) {
    const date = missingDates[0]!
    await queryClient.fetchQuery({
      queryKey: nutritionDayQueryKey(userId, date),
      queryFn: async () => {
        const entries = await fetchNutritionDayEntries(nhost, userId, date)
        return buildNutritionDaySummary(date, entries, settings)
      },
      staleTime: 60_000,
    })
  } else {
    const from = windowDates[0]!
    const to = windowDates[windowDates.length - 1]!

    await queryClient.fetchQuery({
      queryKey: nutritionHintsRangeQueryKey(userId, from, to),
      queryFn: async () => {
        const entries = await fetchNutritionHintRangeEntries(nhost, userId, from, to)
        const byDate = groupEntriesByDate(entries)

        for (const date of windowDates) {
          const dayEntries = byDate.get(date) ?? []
          queryClient.setQueryData(
            nutritionDayQueryKey(userId, date),
            buildNutritionDaySummary(date, dayEntries, settings),
          )
        }

        return entries
      },
      staleTime: 60_000,
    })
  }

  return windowDates.flatMap((date) => getCachedEntries(queryClient, userId, date) ?? [])
}

function getNutritionDayCacheRevision(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  dates: string[],
) {
  if (!userId) {
    return 'missing-user'
  }

  return dates
    .map((date) => {
      const summary = queryClient.getQueryData<NutritionDaySummary>(
        nutritionDayQueryKey(userId, date),
      )
      if (!summary) {
        return `${date}:missing`
      }

      return `${date}:${summary.entries.length}:${summary.totals.calories}`
    })
    .join('|')
}

function useNutritionDayCacheRevision(userId: string | undefined, dates: string[]) {
  const queryClient = useQueryClient()

  return useSyncExternalStore(
    (onStoreChange) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.query.queryKey[0] === 'nutrition-day') {
          onStoreChange()
        }
      }),
    () => getNutritionDayCacheRevision(queryClient, userId, dates),
    () => getNutritionDayCacheRevision(queryClient, userId, dates),
  )
}

export function useNutritionHintAvailability(
  anchorDate: string,
  settings: NutritionSettings | null | undefined,
  weightKg?: number | null,
) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id
  const windowDates = useMemo(() => getHintWindowDates(anchorDate), [anchorDate])
  const cacheRevision = useNutritionDayCacheRevision(userId, windowDates)

  return useMemo(() => {
    if (!settings || !userId) {
      return { hasActionableHint: false as const, hintId: null }
    }

    const cachedEntryCount = countCachedWindowEntries(windowDates, (date) =>
      getCachedEntries(queryClient, userId, date),
    )

    if (cachedEntryCount === 0) {
      return { hasActionableHint: false as const, hintId: null }
    }

    const entries = windowDates.flatMap((date) => getCachedEntries(queryClient, userId, date) ?? [])
    const byDate = groupEntriesByDate(entries)
    const metrics = buildNutritionHintMetrics(anchorDate, byDate, settings, weightKg)
    const hint = pickNutritionHint(metrics)

    return {
      hasActionableHint: isNutritionHintVisible(metrics, hint.id),
      hintId: hint.id,
    }
  }, [anchorDate, cacheRevision, queryClient, settings, userId, weightKg, windowDates])
}

export function useNutritionHints(
  anchorDate: string,
  settings: NutritionSettings | null | undefined,
  open: boolean,
  weightKg?: number | null,
) {
  const { nhost, isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id
  const windowDates = useMemo(() => getHintWindowDates(anchorDate), [anchorDate])
  const cacheRevision = useNutritionDayCacheRevision(userId, windowDates)

  return useQuery({
    queryKey: [...nutritionHintsQueryKey(userId, anchorDate), cacheRevision] as const,
    enabled: open && isAuthenticated && Boolean(settings) && Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      const entries = await ensureWindowEntries(
        queryClient,
        nhost,
        userId!,
        anchorDate,
        settings!,
      )
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
