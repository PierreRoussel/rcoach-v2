import type { NhostClient } from '@nhost/nhost-js'

import type { WeightEntry } from '@/lib/graphql/operations'
import { UPDATE_WEIGHT_GOAL } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  buildProjectionPersistPayload,
  computeProjectionSnapshot,
  refreshAndMergeProjection,
  type ProjectionRefreshTrigger,
  type WeightGoal,
  type WeightGoalRecord,
} from '@/lib/goals/weight-goal'
import { resolveWeightGoal } from '@/lib/measurements/current-weight'
import type { StoredUserMeasurements } from '@/lib/measurements/types'
import type { NutritionSettings } from '@/lib/nutrition/types'

export type SyncWeightGoalProjectionInput = {
  trigger: ProjectionRefreshTrigger
  goalRecord: WeightGoalRecord | null | undefined
  weightEntries?: WeightEntry[] | null
  nutritionSettings?: NutritionSettings | null
  measurements?: StoredUserMeasurements | null
}

export async function syncWeightGoalProjection(
  nhost: NhostClient,
  userId: string,
  input: SyncWeightGoalProjectionInput,
) {
  const { trigger, goalRecord, weightEntries, nutritionSettings, measurements } = input

  if (!goalRecord || goalRecord.goal_type === 'maintain') {
    return null
  }

  const resolvedGoal = resolveWeightGoal(goalRecord, weightEntries)
  if (!resolvedGoal) {
    return null
  }

  const snapshot = computeProjectionSnapshot(
    resolvedGoal,
    nutritionSettings,
    measurements,
    new Date(),
  )

  if (!snapshot) {
    return null
  }

  const merged = refreshAndMergeProjection(goalRecord, snapshot, trigger)
  const computedAt = new Date()
  const payload = buildProjectionPersistPayload(merged, computedAt)

  const data = await graphqlRequest<{
    update_weight_goals_by_pk: WeightGoalRecord
  }>(nhost, UPDATE_WEIGHT_GOAL, {
    userId,
    changes: {
      ...payload,
      updated_at: computedAt.toISOString(),
    },
  })

  return data.update_weight_goals_by_pk
}

export function buildSyncWeightGoalProjectionInput(
  trigger: ProjectionRefreshTrigger,
  goalRecord: WeightGoalRecord | null | undefined,
  weightEntries: WeightEntry[] | null | undefined,
  nutritionSettings: NutritionSettings | null | undefined,
  measurements: StoredUserMeasurements | null | undefined,
): SyncWeightGoalProjectionInput {
  return {
    trigger,
    goalRecord,
    weightEntries,
    nutritionSettings,
    measurements,
  }
}

export function shouldSyncProjectionOnNutritionChange(
  previous: Pick<NutritionSettings, 'daily_calorie_target' | 'activity_level'> | null | undefined,
  next: Pick<NutritionSettings, 'daily_calorie_target' | 'activity_level'>,
) {
  if (!previous) {
    return true
  }

  return (
    previous.daily_calorie_target !== next.daily_calorie_target ||
    previous.activity_level !== next.activity_level
  )
}

export type { WeightGoal }
