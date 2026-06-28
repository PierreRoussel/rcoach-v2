import { describe, expect, it } from 'vitest'

import type { ScheduledSession } from '@/lib/schedule/expand-occurrences'
import {
  buildWorkoutCelebrations,
  isWorkoutPlannedForToday,
  willWeeklyStreakIncrease,
} from '@/lib/workout/workout-celebration'

const baseSession: ScheduledSession = {
  id: 'session-1',
  title: 'Push',
  workout_template_id: 'template-a',
  workout_template_id_b: null,
  recurrence_type: 'weekly',
  weekdays: [3],
  scheduled_date: null,
  time_local: '18:00',
  start_date: '2026-01-01',
  end_date: null,
  is_active: true,
  workout_template: { id: 'template-a', name: 'Push' },
  workout_template_b: null,
}

describe('isWorkoutPlannedForToday', () => {
  it('returns true when template matches a today occurrence', () => {
    expect(
      isWorkoutPlannedForToday([baseSession], {
        workoutTemplateId: 'template-a',
        startedAt: '2026-06-24T10:00:00.000Z',
        now: new Date('2026-06-24T12:00:00'),
      }),
    ).toBe(true)
  })

  it('returns false when template does not match', () => {
    expect(
      isWorkoutPlannedForToday([baseSession], {
        workoutTemplateId: 'template-b',
        startedAt: '2026-06-24T10:00:00.000Z',
        now: new Date('2026-06-24T12:00:00'),
      }),
    ).toBe(false)
  })
})

describe('willWeeklyStreakIncrease', () => {
  it('increases when first workout of the current week', () => {
    const now = new Date('2026-06-25T12:00:00')
    const result = willWeeklyStreakIncrease(
      [{ started_at: '2026-06-18T10:00:00.000Z' }],
      { started_at: '2026-06-25T10:00:00.000Z' },
      now,
    )

    expect(result.increases).toBe(true)
    expect(result.newStreak).toBe(2)
  })

  it('does not increase on second workout same week', () => {
    const now = new Date('2026-06-25T12:00:00')
    const result = willWeeklyStreakIncrease(
      [{ started_at: '2026-06-24T10:00:00.000Z' }],
      { started_at: '2026-06-25T10:00:00.000Z' },
      now,
    )

    expect(result.increases).toBe(false)
  })
})

describe('buildWorkoutCelebrations', () => {
  it('returns both celebrations when applicable', () => {
    const celebrations = buildWorkoutCelebrations({
      sessions: [baseSession],
      existingWorkouts: [{ started_at: '2026-06-18T10:00:00.000Z' }],
      workoutTemplateId: 'template-a',
      startedAt: '2026-06-24T10:00:00.000Z',
      now: new Date('2026-06-24T12:00:00'),
    })

    expect(celebrations).toEqual([
      { kind: 'planned' },
      { kind: 'weekly_streak', streak: 2 },
    ])
  })
})
