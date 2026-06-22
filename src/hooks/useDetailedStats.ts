import { useMemo } from 'react'

import {
  computeMuscleVolumeStats,
  computeRadarData,
  computeTopExerciseByZone,
  getBodyRegionIntensity,
} from '@/lib/stats/analytics'
import type { WorkoutSummary } from '@/lib/graphql/operations'
import { useWorkoutStats } from '@/hooks/useWorkouts'

export function useDetailedStats(workouts: WorkoutSummary[] | undefined) {
  const weeklyStats = useWorkoutStats(workouts)

  const muscleStats = useMemo(
    () => computeMuscleVolumeStats(workouts),
    [workouts],
  )

  const radarData = useMemo(() => computeRadarData(muscleStats), [muscleStats])

  const bodyIntensities = useMemo(
    () => getBodyRegionIntensity(muscleStats),
    [muscleStats],
  )

  const topByZone = useMemo(
    () => computeTopExerciseByZone(workouts),
    [workouts],
  )

  const totalVolume = weeklyStats.reduce((sum, point) => sum + point.volume, 0)
  const totalSessions = workouts?.length ?? 0
  const activeZones = muscleStats.filter((item) => item.sets > 0).length

  return {
    weeklyStats,
    muscleStats,
    radarData,
    bodyIntensities,
    topByZone,
    totalVolume,
    totalSessions,
    activeZones,
  }
}
