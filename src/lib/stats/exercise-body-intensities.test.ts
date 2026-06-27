import { describe, expect, it } from 'vitest'

import { getExerciseBodyIntensities } from '@/lib/stats/exercise-body-intensities'

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
