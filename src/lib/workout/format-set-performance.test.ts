import { describe, expect, it } from 'vitest'

import { formatSetPerformanceSummary } from '@/lib/workout/format-set-performance'
import {
  buildTemplateSetHistory,
  pickLastMatchingWorkout,
  type HistoricalWorkout,
} from '@/lib/workout/template-set-history'

describe('formatSetPerformanceSummary', () => {
  it('formats reps x weight with rpe', () => {
    expect(
      formatSetPerformanceSummary({ reps: 5, weight_kg: 54, rpe: 7.5 }),
    ).toBe('5x54kg @7.5')
  })

  it('omits rpe when disabled', () => {
    expect(
      formatSetPerformanceSummary(
        { reps: 5, weight_kg: 54, rpe: 7.5 },
        { includeRpe: false },
      ),
    ).toBe('5x54kg')
  })

  it('shows reps for bodyweight sets without meaningful load', () => {
    expect(formatSetPerformanceSummary({ reps: 10, weight_kg: null })).toBe('10 reps')
    expect(formatSetPerformanceSummary({ reps: 10, weight_kg: 0 })).toBe('10 reps')
    expect(
      formatSetPerformanceSummary({ reps: 8, weight_kg: 0, rpe: 7 }),
    ).toBe('8 reps @7')
  })
})

describe('pickLastMatchingWorkout', () => {
  const templateExerciseIds = ['ex-a', 'ex-b']

  it('prefers workouts linked by template id', () => {
    const workouts: HistoricalWorkout[] = [
      {
        workout_template_id: null,
        started_at: '2026-06-10T10:00:00Z',
        workout_exercises: [
          { exercise_id: 'ex-a', sets: [] },
          { exercise_id: 'ex-b', sets: [] },
        ],
      },
      {
        workout_template_id: 'tpl-1',
        started_at: '2026-06-09T10:00:00Z',
        workout_exercises: [{ exercise_id: 'ex-a', sets: [] }],
      },
    ]

    expect(
      pickLastMatchingWorkout(workouts, 'tpl-1', templateExerciseIds)?.started_at,
    ).toBe('2026-06-09T10:00:00Z')
  })

  it('falls back to structural match for legacy workouts', () => {
    const workouts: HistoricalWorkout[] = [
      {
        workout_template_id: null,
        started_at: '2026-06-10T10:00:00Z',
        workout_exercises: [
          { exercise_id: 'ex-a', sets: [] },
          { exercise_id: 'ex-b', sets: [] },
        ],
      },
    ]

    expect(
      pickLastMatchingWorkout(workouts, 'tpl-1', templateExerciseIds)?.started_at,
    ).toBe('2026-06-10T10:00:00Z')
  })
})

describe('buildTemplateSetHistory', () => {
  it('indexes summaries by exercise and set index', () => {
    const history = buildTemplateSetHistory({
      started_at: '2026-06-10T10:00:00Z',
      workout_exercises: [
        {
          exercise_id: 'ex-a',
          sets: [{ set_index: 0, weight_kg: 54, reps: 5, rpe: 7.5 }],
        },
      ],
    })

    expect(history.get('ex-a')?.get(0)).toBe('5x54kg @7.5')
  })
})
