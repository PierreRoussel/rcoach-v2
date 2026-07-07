import { describe, expect, it } from 'vitest'

import type { ActiveSet } from '@/lib/workout/active-store'
import {
  formatActiveExerciseCollapsedSummary,
  formatExerciseSubtitle,
  isExerciseComplete,
} from '@/lib/workout/format-exercise-collapsed-summary'

function set(partial: Partial<ActiveSet> & Pick<ActiveSet, 'setIndex'>): ActiveSet {
  return {
    setType: 'normal',
    weightKg: null,
    reps: null,
    durationSeconds: null,
    completedAt: '2026-06-27T10:00:00.000Z',
    ...partial,
  }
}

describe('formatActiveExerciseCollapsedSummary', () => {
  it('formats uniform bodyweight sets', () => {
    const summary = formatActiveExerciseCollapsedSummary(
      [
        set({ setIndex: 0, reps: 12 }),
        set({ setIndex: 1, reps: 12 }),
        set({ setIndex: 2, reps: 12 }),
        set({ setIndex: 3, reps: 12 }),
      ],
      { exerciseName: 'Pull-ups', equipment: 'bodyweight' },
    )

    expect(summary).toBe('4 × 12')
  })

  it('ignores warm-up sets in the summary', () => {
    const summary = formatActiveExerciseCollapsedSummary(
      [
        set({ setIndex: 0, setType: 'warmup', reps: 8 }),
        set({ setIndex: 1, reps: 10 }),
        set({ setIndex: 2, reps: 10 }),
      ],
      { exerciseName: 'Squat', equipment: 'barbell', muscleGroup: 'legs' },
    )

    expect(summary).toBe('2 × 10')
  })

  it('formats weighted uniform sets with load', () => {
    const summary = formatActiveExerciseCollapsedSummary(
      [
        set({ setIndex: 0, reps: 5, weightKg: 80 }),
        set({ setIndex: 1, reps: 5, weightKg: 80 }),
      ],
      { exerciseName: 'Squat', equipment: 'barbell' },
    )

    expect(summary).toBe('2 × 5 @ 80kg')
  })
})

describe('formatExerciseSubtitle', () => {
  it('joins muscle group and equipment labels', () => {
    expect(formatExerciseSubtitle('back', 'bodyweight')).toBe('Dos · Poids du corps')
  })
})

describe('isExerciseComplete', () => {
  it('returns true only when every set is completed', () => {
    expect(
      isExerciseComplete([
        set({ setIndex: 0, reps: 8 }),
        set({ setIndex: 1, reps: 8, completedAt: null }),
      ]),
    ).toBe(false)

    expect(
      isExerciseComplete([
        set({ setIndex: 0, reps: 8 }),
        set({ setIndex: 1, reps: 8 }),
      ]),
    ).toBe(true)
  })
})
