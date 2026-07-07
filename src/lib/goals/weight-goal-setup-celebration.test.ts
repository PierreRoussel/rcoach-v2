import { describe, expect, it } from 'vitest'

import {
  buildCelebrationGoalSnapshot,
  buildWeightGoalProjectionChartData,
  buildWeightGoalSetupCelebrationPayload,
  shouldShowWeightGoalSetupCelebration,
} from '@/lib/goals/weight-goal-setup-celebration'
import { resolveGoalChartProjection } from '@/lib/goals/weight-goal'

describe('shouldShowWeightGoalSetupCelebration', () => {
  it('shows on create for lose or gain', () => {
    expect(
      shouldShowWeightGoalSetupCelebration({
        mode: 'create',
        nextTargetKg: 70,
        goalType: 'lose',
      }),
    ).toBe(true)
  })

  it('hides for maintain goals', () => {
    expect(
      shouldShowWeightGoalSetupCelebration({
        mode: 'create',
        nextTargetKg: 75,
        goalType: 'maintain',
      }),
    ).toBe(false)
  })

  it('shows on edit only when target changes', () => {
    expect(
      shouldShowWeightGoalSetupCelebration({
        mode: 'edit',
        previousTargetKg: 74,
        nextTargetKg: 70,
        goalType: 'lose',
      }),
    ).toBe(true)

    expect(
      shouldShowWeightGoalSetupCelebration({
        mode: 'edit',
        previousTargetKg: 74,
        nextTargetKg: 74,
        goalType: 'lose',
      }),
    ).toBe(false)
  })
})

describe('buildWeightGoalSetupCelebrationPayload', () => {
  it('returns null for maintain snapshots', () => {
    expect(
      buildWeightGoalSetupCelebrationPayload({
        currentKg: 75,
        targetKg: 75.1,
        dailyCalorieTarget: 2200,
        tdee: 2200,
      }),
    ).toBeNull()
  })

  it('builds a lose goal snapshot', () => {
    const payload = buildWeightGoalSetupCelebrationPayload({
      currentKg: 80,
      targetKg: 75,
      dailyCalorieTarget: 2100,
      tdee: 2400,
    })

    expect(payload?.goal.goal_type).toBe('lose')
    expect(payload?.goal.target_weight_kg).toBe(75)
  })
})

describe('buildWeightGoalProjectionChartData', () => {
  it('builds points from current to target', () => {
    const goal = buildCelebrationGoalSnapshot(80, 75, new Date('2026-06-25T12:00:00'))
    const chartProjection = resolveGoalChartProjection(goal, null, new Date('2026-06-25T12:00:00'))
    const points = buildWeightGoalProjectionChartData(
      goal,
      chartProjection,
      new Date('2026-06-25T12:00:00'),
    )

    expect(points.length).toBeGreaterThanOrEqual(4)
    expect(points[0]?.weight).toBe(80)
    expect(points.at(-1)?.weight).toBe(75)
  })
})
