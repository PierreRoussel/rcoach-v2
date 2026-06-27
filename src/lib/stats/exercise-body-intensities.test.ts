import { describe, expect, it } from 'vitest'

import {
  computeWorkoutBodyIntensities,
  getExerciseBodyIntensities,
} from '@/lib/stats/exercise-body-intensities'

describe('getExerciseBodyIntensities', () => {
  it('highlights chest for chest exercises', () => {
    expect(getExerciseBodyIntensities('chest').chest).toBe(1)
  })

  it('adds forearm emphasis for biceps', () => {
    const intensities = getExerciseBodyIntensities('biceps')
    expect(intensities.biceps).toBe(1)
    expect(intensities.forearms).toBeGreaterThan(0)
  })

  it('spreads intensity for full body', () => {
    const intensities = getExerciseBodyIntensities('full_body')
    expect(intensities.chest).toBeGreaterThan(0)
    expect(intensities.legs).toBeGreaterThan(0)
  })
})

describe('computeWorkoutBodyIntensities', () => {
  it('returns empty intensities when no completed sets', () => {
    const intensities = computeWorkoutBodyIntensities([
      {
        muscleGroup: 'chest',
        sets: [{ setType: 'normal', weightKg: 80, reps: 10, completedAt: null }],
      },
    ])

    expect(intensities.chest).toBe(0)
  })

  it('highlights worked muscles from validated sets', () => {
    const intensities = computeWorkoutBodyIntensities([
      {
        muscleGroup: 'chest',
        sets: [
          {
            setType: 'normal',
            weightKg: 80,
            reps: 10,
            completedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      {
        muscleGroup: 'biceps',
        sets: [
          {
            setType: 'normal',
            weightKg: 20,
            reps: 12,
            completedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ])

    expect(intensities.chest).toBe(1)
    expect(intensities.biceps).toBeGreaterThan(0)
    expect(intensities.biceps).toBeLessThan(1)
  })

  it('counts bodyweight sets when volume is zero', () => {
    const intensities = computeWorkoutBodyIntensities([
      {
        muscleGroup: 'abs',
        sets: [
          {
            setType: 'normal',
            weightKg: 0,
            reps: 15,
            completedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    ])

    expect(intensities.abs).toBe(1)
  })
})
