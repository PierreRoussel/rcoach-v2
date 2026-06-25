import { describe, expect, it } from 'vitest'

import {
  EXERCISE_TRANSLATIONS,
  SEED_EXERCISE_NAMES,
  type ExerciseLocale,
} from '@/lib/workout/exercise-translations'
import {
  exerciseNameMatchesQuery,
  translateExerciseName,
} from '@/lib/workout/translate-exercise-name'

describe('SEED_EXERCISE_NAMES coverage', () => {
  it('covers every seeded public exercise name', () => {
    expect(SEED_EXERCISE_NAMES).toHaveLength(80)
  })

  it('defines a fr entry for each seed exercise', () => {
    for (const name of SEED_EXERCISE_NAMES) {
      expect(EXERCISE_TRANSLATIONS[name]?.fr).toBeDefined()
    }
  })
})

describe('translateExerciseName anglicisms', () => {
  const anglicisms = [
    'Thruster (Kettlebell)',
    'Box Jump',
    'Face Pull (Cable)',
    'Farmer Walk (Dumbbell)',
    'Kettlebell Swing',
    'Hip Thrust (Barbell)',
    'Pec Deck (Machine)',
    'Hack Squat (Machine)',
    'Leg Curl (Machine)',
    'Leg Extension (Machine)',
    'Floor Press (Barbell)',
    'Goblet Squat (Dumbbell)',
    'Russian Twist (Weighted)',
  ]

  it.each(anglicisms)('keeps canonical name for %s in fr mode', (name) => {
    expect(translateExerciseName(name, 'fr')).toBe(name)
  })
})

describe('translateExerciseName', () => {
  it('returns canonical name for en locale', () => {
    expect(translateExerciseName('Bench Press (Barbell)', 'en')).toBe(
      'Bench Press (Barbell)',
    )
  })

  it('translates known exercises to french', () => {
    expect(translateExerciseName('Squat (Barbell)', 'fr')).toBe('Squat (Barre)')
    expect(translateExerciseName('Bench Press (Barbell)', 'fr')).toBe(
      'Développé couché (Barre)',
    )
  })

  it('returns unknown names unchanged', () => {
    expect(translateExerciseName('Mon exercice perso', 'fr')).toBe(
      'Mon exercice perso',
    )
  })
})

describe('exerciseNameMatchesQuery', () => {
  it('matches canonical and translated names', () => {
    const locale: ExerciseLocale = 'fr'

    expect(
      exerciseNameMatchesQuery('Bench Press (Barbell)', 'developpe', locale),
    ).toBe(true)
    expect(
      exerciseNameMatchesQuery('Bench Press (Barbell)', 'bench', locale),
    ).toBe(true)
    expect(
      exerciseNameMatchesQuery('Bench Press (Barbell)', 'squat', locale),
    ).toBe(false)
  })
})
