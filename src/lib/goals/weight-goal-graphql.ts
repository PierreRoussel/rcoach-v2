import type { NhostClient } from '@nhost/nhost-js'

import { graphqlRequest } from '@/lib/graphql/request'
import type { WeightGoalRecord } from '@/lib/goals/weight-goal'

export const GET_WEIGHT_GOAL_LEGACY = `
  query GetWeightGoalLegacy($userId: uuid!) {
    weight_goals_by_pk(user_id: $userId) {
      user_id
      target_weight_kg
      start_weight_kg
      goal_type
      last_milestone_step
      created_at
      updated_at
    }
  }
`

export const UPDATE_WEIGHT_GOAL_PROJECTION = `
  mutation UpdateWeightGoalProjection(
    $userId: uuid!
    $changes: weight_goals_set_input!
  ) {
    update_weight_goals_by_pk(
      pk_columns: { user_id: $userId }
      _set: $changes
    ) {
      user_id
      projected_completion_at
      projection_computed_at
      projection_weekly_rate_kg
      updated_at
    }
  }
`

let projectionSchemaAvailable: boolean | null = null

export function isWeightGoalProjectionSchemaAvailable() {
  return projectionSchemaAvailable !== false
}

export function isWeightGoalProjectionSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes("field 'projected_completion_at' not found") ||
    error.message.includes('projected_completion_at')
  )
}

export function normalizeWeightGoalRecord(
  record:
    | (Omit<
        WeightGoalRecord,
        | 'projected_completion_at'
        | 'projection_computed_at'
        | 'projection_weekly_rate_kg'
      > &
        Partial<
          Pick<
            WeightGoalRecord,
            | 'projected_completion_at'
            | 'projection_computed_at'
            | 'projection_weekly_rate_kg'
          >
        >)
    | null,
): WeightGoalRecord | null {
  if (!record) {
    return null
  }

  return {
    ...record,
    projected_completion_at: record.projected_completion_at ?? null,
    projection_computed_at: record.projection_computed_at ?? null,
    projection_weekly_rate_kg: record.projection_weekly_rate_kg ?? null,
  }
}

export async function fetchWeightGoalRecord(
  nhost: NhostClient,
  userId: string,
  query: string,
) {
  if (projectionSchemaAvailable === false) {
    const legacy = await graphqlRequest<{
      weight_goals_by_pk: WeightGoalRecord | null
    }>(nhost, GET_WEIGHT_GOAL_LEGACY, { userId })

    return normalizeWeightGoalRecord(legacy.weight_goals_by_pk)
  }

  try {
    const data = await graphqlRequest<{
      weight_goals_by_pk: WeightGoalRecord | null
    }>(nhost, query, { userId })

    projectionSchemaAvailable = true
    return normalizeWeightGoalRecord(data.weight_goals_by_pk)
  } catch (error) {
    if (!isWeightGoalProjectionSchemaError(error)) {
      throw error
    }

    projectionSchemaAvailable = false

    const legacy = await graphqlRequest<{
      weight_goals_by_pk: WeightGoalRecord | null
    }>(nhost, GET_WEIGHT_GOAL_LEGACY, { userId })

    return normalizeWeightGoalRecord(legacy.weight_goals_by_pk)
  }
}

export async function updateWeightGoalProjection(
  nhost: NhostClient,
  userId: string,
  changes: {
    projected_completion_at: string | null
    projection_computed_at: string
    projection_weekly_rate_kg: number | null
    updated_at: string
  },
) {
  if (projectionSchemaAvailable === false) {
    return null
  }

  try {
    const data = await graphqlRequest<{
      update_weight_goals_by_pk: WeightGoalRecord
    }>(nhost, UPDATE_WEIGHT_GOAL_PROJECTION, {
      userId,
      changes,
    })

    projectionSchemaAvailable = true
    return data.update_weight_goals_by_pk
  } catch (error) {
    if (isWeightGoalProjectionSchemaError(error)) {
      projectionSchemaAvailable = false
      return null
    }

    throw error
  }
}
