import { describe, expect, it } from 'vitest'

import {
  getLatestWeightKg,
  resolveWeightGoal,
} from '@/lib/measurements/current-weight'
import type { WeightGoalRecord } from '@/lib/goals/weight-goal'

const goalRecord: WeightGoalRecord = {
  user_id: 'user-1',
  target_weight_kg: 70,
  start_weight_kg: 80,
  goal_type: 'lose',
  last_milestone_step: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('getLatestWeightKg', () => {
  it('returns the most recent entry', () => {
    expect(
      getLatestWeightKg([
        {
          id: '1',
          weight_kg: 78,
          logged_at: '2026-01-01T00:00:00.000Z',
          source: 'adjust',
        },
        {
          id: '2',
          weight_kg: 74.2,
          logged_at: '2026-02-01T00:00:00.000Z',
          source: 'adjust',
        },
      ]),
    ).toBe(74.2)
  })
})

describe('resolveWeightGoal', () => {
  it('uses the latest weight entry as current weight', () => {
    const resolved = resolveWeightGoal(goalRecord, [
      {
        id: '1',
        weight_kg: 74.2,
        logged_at: '2026-02-01T00:00:00.000Z',
        source: 'adjust',
      },
    ])

    expect(resolved?.current_weight_kg).toBe(74.2)
  })

  it('falls back to start weight when there are no entries', () => {
    const resolved = resolveWeightGoal(goalRecord, [])

    expect(resolved?.current_weight_kg).toBe(80)
  })
})
