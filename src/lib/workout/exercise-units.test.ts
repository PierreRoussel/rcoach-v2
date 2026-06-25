import { describe, expect, it } from 'vitest'

import { buildExerciseUnits } from '@/lib/workout/exercise-units'

type Exercise = {
  supersetId: number | null
}

describe('exercise-units', () => {
  it('groups non-contiguous superset members into one unit', () => {
    const exercises: Exercise[] = [
      { supersetId: 1 },
      { supersetId: null },
      { supersetId: 1 },
    ]

    expect(buildExerciseUnits(exercises)).toEqual([
      { type: 'superset', supersetId: 1, indices: [0, 2] },
      { type: 'single', index: 1 },
    ])
  })

  it('treats a lone superset member as a single exercise', () => {
    const exercises: Exercise[] = [{ supersetId: 1 }, { supersetId: null }]

    expect(buildExerciseUnits(exercises)).toEqual([
      { type: 'single', index: 0 },
      { type: 'single', index: 1 },
    ])
  })

  it('keeps multiple supersets separate', () => {
    const exercises: Exercise[] = [
      { supersetId: 1 },
      { supersetId: 1 },
      { supersetId: null },
      { supersetId: 2 },
      { supersetId: 2 },
    ]

    expect(buildExerciseUnits(exercises)).toEqual([
      { type: 'superset', supersetId: 1, indices: [0, 1] },
      { type: 'single', index: 2 },
      { type: 'superset', supersetId: 2, indices: [3, 4] },
    ])
  })
})
