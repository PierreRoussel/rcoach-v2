import { describe, expect, it } from 'vitest'

import {
  adjustWeightKg,
  buildProjectionPersistPayload,
  computeProjectionSnapshot,
  inferWeightGoalType,
  institutionWeightSnapshot,
  isMaintainGoalInRange,
  isProgressOnTrack,
  isProjectionStale,
  isWeightGoalReached,
  isWeightGoalReinstitution,
  milestoneStepFromProgress,
  progressKgSinceStart,
  projectWeightGoalCompletion,
  refreshAndMergeProjection,
  resolveGoalChartProjection,
  resolveGoalPaceStatus,
  resolveStableProjection,
  remainingKgToTarget,
  resolveMaintainGoalDisplay,
  shouldSuggestCalorieUpdate,
  suggestCalorieTarget,
  type WeightGoal,
} from '@/lib/goals/weight-goal'
import type { NutritionSettings } from '@/lib/nutrition/types'

const baseMeasurements = {
  sex: 'male' as const,
  age: 30,
  height_cm: 180,
  waist_cm: null,
}

const baseSettings: NutritionSettings = {
  user_id: 'user-1',
  daily_calorie_target: 2500,
  carbs_pct: 40,
  protein_pct: 30,
  fat_pct: 30,
  breakfast_pct: 20,
  lunch_pct: 35,
  snack_pct: 10,
  dinner_pct: 35,
  activity_level: 'moderate',
  calorie_adjustment: 0,
  tdee_calculated: 2500,
  onboarded_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('isWeightGoalReached', () => {
  it('does not treat lose goal as reached when still above target', () => {
    expect(
      isWeightGoalReached({
        goal_type: 'lose',
        current_weight_kg: 74.2,
        target_weight_kg: 74,
      }),
    ).toBe(false)
  })

  it('treats lose goal as reached at or below target', () => {
    expect(
      isWeightGoalReached({
        goal_type: 'lose',
        current_weight_kg: 74,
        target_weight_kg: 74,
      }),
    ).toBe(true)
  })

  it('does not treat gain goal as reached when still below target', () => {
    expect(
      isWeightGoalReached({
        goal_type: 'gain',
        current_weight_kg: 79.8,
        target_weight_kg: 80,
      }),
    ).toBe(false)
  })

  it('treats gain goal as reached at or above target', () => {
    expect(
      isWeightGoalReached({
        goal_type: 'gain',
        current_weight_kg: 80,
        target_weight_kg: 80,
      }),
    ).toBe(true)
  })

  it('never treats maintain goal as reached', () => {
    expect(
      isWeightGoalReached({
        goal_type: 'maintain',
        current_weight_kg: 76,
        target_weight_kg: 76,
      }),
    ).toBe(false)
  })
})

describe('maintain goal display', () => {
  it('detects in-range drift within 1.5 kg', () => {
    expect(
      isMaintainGoalInRange({
        current_weight_kg: 75.2,
        target_weight_kg: 76,
      }),
    ).toBe(true)
  })

  it('detects out-of-range drift beyond 1.5 kg', () => {
    expect(
      isMaintainGoalInRange({
        current_weight_kg: 74.4,
        target_weight_kg: 76,
      }),
    ).toBe(false)
  })

  it('computes left gauge fill when below target', () => {
    expect(
      resolveMaintainGoalDisplay({
        current_weight_kg: 75,
        target_weight_kg: 76,
      }),
    ).toEqual({
      inRange: true,
      driftKg: -1,
      direction: 'low',
      gaugeFillPercent: (1 / 1.5) * 100,
    })
  })

  it('computes right gauge fill when above target', () => {
    const display = resolveMaintainGoalDisplay({
      current_weight_kg: 78,
      target_weight_kg: 76,
    })

    expect(display.inRange).toBe(false)
    expect(display.driftKg).toBe(2)
    expect(display.direction).toBe('high')
    expect(display.gaugeFillPercent).toBe(100)
  })
})

describe('institutionWeightSnapshot', () => {
  it('uses current weight as start when a goal is set up', () => {
    const snapshot = institutionWeightSnapshot(74.2, 70)

    expect(snapshot.start_weight_kg).toBe(74.2)
    expect(snapshot.target_weight_kg).toBe(70)
    expect(snapshot.goal_type).toBe('lose')
    expect(snapshot.last_milestone_step).toBe(0)
  })
})

describe('isWeightGoalReinstitution', () => {
  it('detects when the target weight changes', () => {
    expect(
      isWeightGoalReinstitution({ target_weight_kg: 74 }, 73),
    ).toBe(true)
    expect(
      isWeightGoalReinstitution({ target_weight_kg: 74 }, 74),
    ).toBe(false)
  })
})

describe('inferWeightGoalType', () => {
  it('detects weight loss', () => {
    expect(inferWeightGoalType(80, 75)).toBe('lose')
  })

  it('detects weight gain', () => {
    expect(inferWeightGoalType(70, 75)).toBe('gain')
  })

  it('detects maintenance when target is close', () => {
    expect(inferWeightGoalType(80, 80.1)).toBe('maintain')
  })
})

describe('progress and milestones', () => {
  it('tracks loss progress as positive values', () => {
    const progress = progressKgSinceStart({
      goal_type: 'lose',
      start_weight_kg: 80,
      current_weight_kg: 78.5,
    })

    expect(progress).toBe(1.5)
    expect(milestoneStepFromProgress(progress, 'lose')).toBe(3)
  })

  it('tracks gain progress as positive values', () => {
    const progress = progressKgSinceStart({
      goal_type: 'gain',
      start_weight_kg: 70,
      current_weight_kg: 71,
    })

    expect(progress).toBe(1)
    expect(milestoneStepFromProgress(progress, 'gain')).toBe(2)
  })

  it('adjusts weight in 100g steps', () => {
    expect(adjustWeightKg(79, -1)).toBe(78.9)
    expect(adjustWeightKg(79, 1)).toBe(79.1)
  })
})

describe('isProgressOnTrack', () => {
  it('rewards weight loss progress for a lose goal', () => {
    expect(
      isProgressOnTrack({
        goal_type: 'lose',
        start_weight_kg: 80,
        current_weight_kg: 78.5,
      }),
    ).toBe(true)
  })

  it('does not reward weight gain for a lose goal', () => {
    expect(
      isProgressOnTrack({
        goal_type: 'lose',
        start_weight_kg: 80,
        current_weight_kg: 80.5,
      }),
    ).toBe(false)
  })

  it('rewards weight gain for a gain goal', () => {
    expect(
      isProgressOnTrack({
        goal_type: 'gain',
        start_weight_kg: 70,
        current_weight_kg: 71,
      }),
    ).toBe(true)
  })

  it('does not reward weight loss for a gain goal', () => {
    expect(
      isProgressOnTrack({
        goal_type: 'gain',
        start_weight_kg: 70,
        current_weight_kg: 69.5,
      }),
    ).toBe(false)
  })

  it('rewards maintain goal when current weight stays within range of target', () => {
    expect(
      isProgressOnTrack({
        goal_type: 'maintain',
        start_weight_kg: 76,
        current_weight_kg: 75.2,
        target_weight_kg: 76,
      }),
    ).toBe(true)
  })
})

describe('calorie suggestion', () => {
  it('suggests lower calories for a loss goal', () => {
    const suggestion = suggestCalorieTarget(
      baseSettings,
      'lose',
      80,
      baseMeasurements,
    )

    expect(suggestion).not.toBeNull()
    expect(suggestion!.suggestedCalories).toBeLessThan(baseSettings.daily_calorie_target)
    expect(shouldSuggestCalorieUpdate(suggestion)).toBe(true)
  })

  it('skips prompt when suggested calories match current intake', () => {
    const baseline = suggestCalorieTarget(
      baseSettings,
      'maintain',
      80,
      baseMeasurements,
    )!
    const maintainSettings = {
      ...baseSettings,
      daily_calorie_target: baseline.suggestedCalories,
      tdee_calculated: baseline.tdee,
    }
    const suggestion = suggestCalorieTarget(
      maintainSettings,
      'maintain',
      80,
      baseMeasurements,
    )

    expect(suggestion).not.toBeNull()
    expect(suggestion!.delta).toBe(0)
    expect(shouldSuggestCalorieUpdate(suggestion)).toBe(false)
  })
})

describe('projectWeightGoalCompletion', () => {
  const loseGoal = {
    goal_type: 'lose' as const,
    current_weight_kg: 80,
    target_weight_kg: 78,
  }

  it('projects completion date from caloric deficit', () => {
    const settings = {
      ...baseSettings,
      daily_calorie_target: 2000,
      tdee_calculated: 2500,
    }

    const projection = projectWeightGoalCompletion(
      loseGoal,
      settings,
      new Date('2026-01-01T00:00:00.000Z'),
      baseMeasurements,
    )

    expect(projection).not.toBeNull()
    expect(projection!.remainingKg).toBe(2)
    expect(projection!.weeklyRateKg).toBeCloseTo(0.4545, 3)
    expect(projection!.projectedDate).not.toBeNull()
  })

  it('returns reached when target is met', () => {
    const projection = projectWeightGoalCompletion(
      {
        goal_type: 'lose',
        current_weight_kg: 78,
        target_weight_kg: 78,
      },
      baseSettings,
      undefined,
      baseMeasurements,
    )

    expect(projection?.isReached).toBe(true)
    expect(projection?.remainingKg).toBe(0)
  })

  it('returns null for maintain goals', () => {
    expect(
      projectWeightGoalCompletion(
        {
          goal_type: 'maintain',
          current_weight_kg: 80,
          target_weight_kg: 80,
        },
        baseSettings,
      ),
    ).toBeNull()
  })

  it('computes remaining weight to target', () => {
    expect(
      remainingKgToTarget({
        goal_type: 'lose',
        current_weight_kg: 80,
        target_weight_kg: 78,
      }),
    ).toBe(2)
  })
})

describe('resolveGoalChartProjection', () => {
  it('uses nutrition projection when available', () => {
    const now = new Date('2026-06-25T12:00:00Z')
    const settings = {
      ...baseSettings,
      daily_calorie_target: 2000,
      tdee_calculated: 2500,
    }
    const nutritionProjection = projectWeightGoalCompletion(
      {
        goal_type: 'lose',
        current_weight_kg: 80,
        target_weight_kg: 75,
      },
      settings,
      now,
      baseMeasurements,
    )

    const chartProjection = resolveGoalChartProjection(
      {
        goal_type: 'lose',
        current_weight_kg: 80,
        target_weight_kg: 75,
      },
      nutritionProjection,
      now,
    )

    expect(chartProjection?.isEstimate).toBe(false)
    expect(chartProjection?.projectedDate).toEqual(
      nutritionProjection?.projectedDate,
    )
  })

  it('falls back to a default weekly rate when nutrition projection is missing', () => {
    const now = new Date('2026-06-25T12:00:00Z')
    const chartProjection = resolveGoalChartProjection(
      {
        goal_type: 'lose',
        current_weight_kg: 80,
        target_weight_kg: 75,
      },
      null,
      now,
    )

    expect(chartProjection?.isEstimate).toBe(true)
    expect(chartProjection?.weeklyRateKg).toBeGreaterThan(0)
    expect(chartProjection?.projectedDate.getTime()).toBeGreaterThan(
      now.getTime(),
    )
  })
})

const anchoredGoalBase: WeightGoal = {
  user_id: 'user-1',
  target_weight_kg: 78,
  start_weight_kg: 80,
  current_weight_kg: 79,
  goal_type: 'lose',
  last_milestone_step: 0,
  projected_completion_at: '2026-08-24T00:00:00.000Z',
  projection_computed_at: '2026-06-01T00:00:00.000Z',
  projection_weekly_rate_kg: 0.5,
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
}

describe('resolveStableProjection', () => {
  const settings = {
    ...baseSettings,
    daily_calorie_target: 2000,
    tdee_calculated: 2500,
  }

  it('keeps the anchored date stable when now advances without new weigh-ins', () => {
    const early = resolveStableProjection(
      anchoredGoalBase,
      settings,
      baseMeasurements,
      '2026-06-10T00:00:00.000Z',
      new Date('2026-06-15T00:00:00.000Z'),
    )
    const later = resolveStableProjection(
      anchoredGoalBase,
      settings,
      baseMeasurements,
      '2026-06-10T00:00:00.000Z',
      new Date('2026-06-22T00:00:00.000Z'),
    )

    expect(early?.projectedDate?.toISOString()).toBe('2026-08-24T00:00:00.000Z')
    expect(later?.projectedDate?.toISOString()).toBe('2026-08-24T00:00:00.000Z')
    expect(early?.isAnchored).toBe(true)
  })

  it('recalculates when no anchor is stored', () => {
    const goal: WeightGoal = {
      ...anchoredGoalBase,
      projected_completion_at: null,
      projection_computed_at: null,
      projection_weekly_rate_kg: null,
    }

    const projection = resolveStableProjection(
      goal,
      settings,
      baseMeasurements,
      '2026-06-10T00:00:00.000Z',
      new Date('2026-06-15T00:00:00.000Z'),
    )

    expect(projection?.isAnchored).toBe(false)
    expect(projection?.projectedDate).not.toBeNull()
  })
})

describe('resolveGoalPaceStatus', () => {
  it('returns on_track when close to the linear trajectory', () => {
    const status = resolveGoalPaceStatus(
      {
        ...anchoredGoalBase,
        current_weight_kg: 79,
      },
      new Date('2026-08-24T00:00:00.000Z'),
      '2026-07-10T00:00:00.000Z',
      new Date('2026-07-15T00:00:00.000Z'),
    )

    expect(status?.status).toBe('on_track')
    expect(status?.message).toBe('Dans les temps')
  })

  it('returns ahead when below the expected trajectory for weight loss', () => {
    const status = resolveGoalPaceStatus(
      {
        ...anchoredGoalBase,
        current_weight_kg: 78.5,
      },
      new Date('2026-08-24T00:00:00.000Z'),
      '2026-07-10T00:00:00.000Z',
      new Date('2026-07-15T00:00:00.000Z'),
    )

    expect(status?.status).toBe('ahead')
  })

  it('returns stale when the last weigh-in is too old', () => {
    const status = resolveGoalPaceStatus(
      anchoredGoalBase,
      new Date('2026-08-24T00:00:00.000Z'),
      '2026-06-01T00:00:00.000Z',
      new Date('2026-07-01T00:00:00.000Z'),
    )

    expect(status?.status).toBe('stale')
  })
})

describe('isProjectionStale', () => {
  it('returns true after 14 days without a weigh-in', () => {
    expect(
      isProjectionStale(
        '2026-06-01T00:00:00.000Z',
        new Date('2026-06-20T00:00:00.000Z'),
      ),
    ).toBe(true)
  })

  it('returns false for a recent weigh-in', () => {
    expect(
      isProjectionStale(
        '2026-06-18T00:00:00.000Z',
        new Date('2026-06-20T00:00:00.000Z'),
      ),
    ).toBe(false)
  })
})

describe('buildProjectionPersistPayload', () => {
  it('clears projection fields when the goal is reached', () => {
    const payload = buildProjectionPersistPayload(
      {
        weeklyRateKg: 0,
        remainingKg: 0,
        projectedDate: null,
        dailyDeficitKcal: 0,
        isReached: true,
      },
      new Date('2026-06-01T00:00:00.000Z'),
    )

    expect(payload.projected_completion_at).toBeNull()
    expect(payload.projection_weekly_rate_kg).toBeNull()
  })
})

describe('refreshAndMergeProjection', () => {
  it('allows an earlier date when the user is ahead after a weigh-in', () => {
    const existing = {
      projected_completion_at: '2026-08-24T00:00:00.000Z',
    }
    const snapshot = computeProjectionSnapshot(
      {
        goal_type: 'lose',
        current_weight_kg: 78.5,
        target_weight_kg: 78,
      },
      {
        ...baseSettings,
        daily_calorie_target: 2000,
        tdee_calculated: 2500,
      },
      baseMeasurements,
      new Date('2026-07-01T00:00:00.000Z'),
    )!

    const merged = refreshAndMergeProjection(existing, snapshot, 'weight_logged')

    expect(merged.projectedDate!.getTime()).toBeLessThan(
      new Date(existing.projected_completion_at).getTime(),
    )
  })
})
