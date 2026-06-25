import { describe, expect, it } from 'vitest'

import {
  exerciseNameMatchesQuery,
  translateExerciseName,
} from '@/lib/workout/translate-exercise-name'

describe('translateExerciseName', () => {
  it('returns canonical name for en locale', () => {
    expect(translateExerciseName('Pull Up', 'en')).toBe('Pull Up')
  })

  it('translates to french when available', () => {
    expect(translateExerciseName('Pull Up', 'fr')).toBe('Traction')
  })

  it('keeps anglicisms in french mode', () => {
    expect(translateExerciseName('Thruster (Kettlebell)', 'fr')).toBe(
      'Thruster (Kettlebell)',
    )
  })
})

describe('exerciseNameMatchesQuery', () => {
  it('matches translated fragments', () => {
    expect(
      exerciseNameMatchesQuery('Lat Pulldown (Cable)', 'tirage', 'fr'),
    ).toBe(true)
  })
})
