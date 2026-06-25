import { useMemo } from 'react'

import { buildExerciseCatalog } from '@/lib/stats/exercise-progression'
import type { WorkoutSummary } from '@/lib/graphql/operations'

export function useExerciseCatalogStats(workouts: WorkoutSummary[] | undefined) {
  return useMemo(() => buildExerciseCatalog(workouts ?? []), [workouts])
}
