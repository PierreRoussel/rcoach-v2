import { useMemo } from 'react'

import {
  buildExerciseSessionRows,
  buildExerciseTimeline,
  compareBestLoadProgression,
  compareHighRpePerformance,
  findExerciseInCatalog,
  getBestPerformanceInPeriod,
  type StatsPeriod,
} from '@/lib/stats/exercise-progression'
import { useExerciseCatalogStats } from '@/hooks/useExerciseCatalogStats'
import type { WorkoutSummary } from '@/lib/graphql/operations'

export function useExerciseProgression(
  workouts: WorkoutSummary[] | undefined,
  exerciseId: string | undefined,
  period: StatsPeriod,
) {
  const catalog = useExerciseCatalogStats(workouts)

  return useMemo(() => {
    if (!exerciseId) {
      return {
        catalogEntry: undefined,
        timeline: [],
        sessions: [],
        bestPerformance: { label: null, date: null, best1Rm: null },
        highRpeComparison: {
          currentOneRm: null,
          baselineOneRm: null,
          deltaKg: null,
          deltaPercent: null,
          currentSetLabel: null,
          baselineSetLabel: null,
          hasEnoughData: false,
        },
        loadComparison: {
          hasEnoughData: false,
          metric: null,
          baselineValue: null,
          currentValue: null,
          baselineLabel: null,
          currentLabel: null,
          baselinePeriodLabel: 'Il y a 3 mois',
          currentPeriodLabel: "Aujourd'hui",
          delta: null,
          deltaPercent: null,
        },
      }
    }

    const list = workouts ?? []

    return {
      catalogEntry: findExerciseInCatalog(catalog, exerciseId),
      timeline: buildExerciseTimeline(list, exerciseId, period),
      sessions: buildExerciseSessionRows(list, exerciseId, period),
      bestPerformance: getBestPerformanceInPeriod(list, exerciseId, period),
      highRpeComparison: compareHighRpePerformance(list, exerciseId, period),
      loadComparison: compareBestLoadProgression(list, exerciseId, period),
    }
  }, [catalog, exerciseId, period, workouts])
}
