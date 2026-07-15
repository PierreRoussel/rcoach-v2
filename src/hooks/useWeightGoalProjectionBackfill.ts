import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useUserMeasurements } from '@/hooks/useUserMeasurements'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useWeightGoal } from '@/hooks/useWeightGoal'
import { needsProjectionBackfill } from '@/lib/goals/weight-goal'
import { isWeightGoalProjectionSchemaAvailable } from '@/lib/goals/weight-goal-graphql'
import { syncWeightGoalProjection } from '@/lib/goals/sync-weight-goal-projection'
import { useAuth } from '@/lib/nhost/AuthProvider'

/** Backfills anchored projection for existing goals missing persisted dates. */
export function useWeightGoalProjectionBackfill() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const { data: goalRecord } = useWeightGoal()
  const { data: weightEntries } = useWeightEntries()
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: userMeasurements } = useUserMeasurements()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (
      !user?.id ||
      !goalRecord ||
      !isWeightGoalProjectionSchemaAvailable() ||
      !needsProjectionBackfill(goalRecord) ||
      !nutritionSettings ||
      syncingRef.current
    ) {
      return
    }

    syncingRef.current = true
    let cancelled = false

    void syncWeightGoalProjection(nhost, user.id, {
      trigger: 'goal_created',
      goalRecord,
      weightEntries,
      nutritionSettings,
      measurements: userMeasurements,
    })
      .then(() => {
        if (!cancelled) {
          void queryClient.invalidateQueries({ queryKey: ['weight-goal'] })
        }
      })
      .finally(() => {
        syncingRef.current = false
      })

    return () => {
      cancelled = true
    }
  }, [
    goalRecord,
    nhost,
    nutritionSettings,
    queryClient,
    user?.id,
    userMeasurements,
    weightEntries,
  ])
}
