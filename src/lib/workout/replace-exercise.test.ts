import { describe, expect, it } from 'vitest'

import {
  replaceActiveExercise,
  replaceTemplateExercise,
} from '@/lib/workout/replace-exercise'

describe('replace-exercise', () => {
  it('replaces active exercise metadata and clears completed sets', () => {
    const next = replaceActiveExercise(
      {
        exerciseId: 'old',
        exerciseName: 'Squat',
        muscleGroup: 'Legs',
        equipment: 'Barbell',
        supersetId: 2,
        defaultRestSeconds: 120,
        sets: [
          {
            setIndex: 0,
            setType: 'normal',
            weightKg: 100,
            reps: 5,
            restSeconds: 120,
            completedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      {
        id: 'new',
        name: 'Front Squat',
        muscle_group: 'Legs',
        equipment: 'Barbell',
      },
    )

    expect(next.exerciseId).toBe('new')
    expect(next.exerciseName).toBe('Front Squat')
    expect(next.supersetId).toBe(2)
    expect(next.defaultRestSeconds).toBe(120)
    expect(next.sets[0]?.weightKg).toBe(100)
    expect(next.sets[0]?.completedAt).toBeNull()
  })

  it('replaces template exercise metadata while keeping sets', () => {
    const next = replaceTemplateExercise(
      {
        exerciseId: 'old',
        exerciseName: 'Bench',
        muscleGroup: 'Chest',
        equipment: 'Barbell',
        supersetId: 1,
        defaultRestSeconds: 90,
        sets: [
          {
            setIndex: 0,
            setType: 'normal',
            weightKg: 60,
            reps: 8,
            restSeconds: 90,
            usesGlobalRest: true,
          },
        ],
      },
      {
        id: 'new',
        name: 'Incline Bench',
        muscle_group: 'Chest',
        equipment: 'Barbell',
      },
    )

    expect(next.exerciseId).toBe('new')
    expect(next.exerciseName).toBe('Incline Bench')
    expect(next.supersetId).toBe(1)
    expect(next.sets).toHaveLength(1)
    expect(next.sets[0]?.weightKg).toBe(60)
  })
})
