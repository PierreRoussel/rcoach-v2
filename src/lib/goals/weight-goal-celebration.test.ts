import { describe, expect, it } from 'vitest'

import {
  buildJourneyChartData,
  computeAverageWeeklyChangeGrams,
  formatJourneyDuration,
  shouldShowWeightGoalReachedCelebration,
  weightGoalReachedCelebrationKey,
} from '@/lib/goals/weight-goal-celebration'
import type { WeightGoal } from '@/lib/goals/weight-goal'

const baseGoal: WeightGoal = {
  user_id: 'user-1',
  target_weight_kg: 75,
  start_weight_kg: 80,
  current_weight_kg: 75,
  goal_type: 'lose',
  last_milestone_step: 10,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
}

describe('computeAverageWeeklyChangeGrams', () => {
  it('returns average weekly loss in grams', () => {
    const grams = computeAverageWeeklyChangeGrams(
      baseGoal,
      new Date('2026-02-01T00:00:00.000Z'),
    )

    expect(grams).toBeGreaterThan(0)
    expect(grams).toBeLessThan(2000)
  })

  it('returns null for maintain goals', () => {
    expect(
      computeAverageWeeklyChangeGrams({
        ...baseGoal,
        goal_type: 'maintain',
      }),
    ).toBeNull()
  })
})

describe('formatJourneyDuration', () => {
  it('formats short journeys in days', () => {
    expect(
      formatJourneyDuration(baseGoal, new Date('2026-01-05T00:00:00.000Z')),
    ).toBe('4 jours')
  })

  it('formats longer journeys in weeks', () => {
    expect(
      formatJourneyDuration(baseGoal, new Date('2026-02-01T00:00:00.000Z')),
    ).toMatch(/semaine/)
  })
})

describe('buildJourneyChartData', () => {
  it('includes start and current weights across weeks', () => {
    const data = buildJourneyChartData(
      baseGoal,
      [
        {
          id: '1',
          user_id: 'user-1',
          weight_kg: 78,
          logged_at: '2026-01-10T00:00:00.000Z',
          source: 'adjust',
        },
      ],
      new Date('2026-01-20T00:00:00.000Z'),
    )

    expect(data.length).toBeGreaterThan(0)
    expect(data.some((point) => point.weight != null)).toBe(true)
  })
})

describe('shouldShowWeightGoalReachedCelebration', () => {
  it('returns false for maintain goals', () => {
    expect(
      shouldShowWeightGoalReachedCelebration(
        { ...baseGoal, goal_type: 'maintain' },
        'user-1',
      ),
    ).toBe(false)
  })

  it('uses a stable storage key', () => {
    expect(weightGoalReachedCelebrationKey('user-1', baseGoal)).toContain(
      'weight-goal-reached-celebration:user-1',
    )
  })
})
