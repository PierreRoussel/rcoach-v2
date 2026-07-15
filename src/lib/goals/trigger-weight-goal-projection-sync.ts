import type { QueryClient } from '@tanstack/react-query'
import type { NhostClient } from '@nhost/nhost-js'

import type { WeightEntry } from '@/lib/graphql/operations'
import {
  buildSyncWeightGoalProjectionInput,
  syncWeightGoalProjection,
  type ProjectionRefreshTrigger,
} from '@/lib/goals/sync-weight-goal-projection'
import type { WeightGoalRecord } from '@/lib/goals/weight-goal'
import type { StoredUserMeasurements } from '@/lib/measurements/types'
import type { NutritionSettings } from '@/lib/nutrition/types'

export async function triggerWeightGoalProjectionSync(
  nhost: NhostClient,
  queryClient: QueryClient,
  userId: string,
  trigger: ProjectionRefreshTrigger,
) {
  const goalRecord = queryClient.getQueryData<WeightGoalRecord | null>([
    'weight-goal',
    userId,
  ])
  const weightEntries = queryClient.getQueryData<WeightEntry[]>([
    'weight-entries',
    userId,
  ])
  const nutritionSettings = queryClient.getQueryData<NutritionSettings | null>([
    'nutrition-settings',
    userId,
  ])
  const userMeasurements = queryClient.getQueryData<StoredUserMeasurements | null>([
    'user-measurements',
    userId,
  ])

  if (!goalRecord || goalRecord.goal_type === 'maintain') {
    return null
  }

  const updated = await syncWeightGoalProjection(
    nhost,
    userId,
    buildSyncWeightGoalProjectionInput(
      trigger,
      goalRecord,
      weightEntries,
      nutritionSettings,
      userMeasurements,
    ),
  )

  if (updated) {
    void queryClient.invalidateQueries({ queryKey: ['weight-goal'] })
  }

  return updated
}
