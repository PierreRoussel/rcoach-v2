import { describe, expect, it } from 'vitest'

import {
  exerciseNameMatchesQuery,
  needsExerciseCatalogLookup,
  resolveExerciseDisplayName,
  resolveExerciseNameFr,
  translateExerciseName,
} from '@/lib/workout/translate-exercise-name'

describe('resolveExerciseNameFr', () => {
  it('uses name_fr from the source when available', () => {
    expect(
      resolveExerciseNameFr(
        { name: 'Bench Press', name_fr: 'Développé couché', id: 'ex-1' },
        [{ id: 'ex-1', name_fr: 'Autre nom' }],
      ),
    ).toBe('Développé couché')
  })

  it('falls back to catalog when name_fr is missing', () => {
    expect(
      resolveExerciseNameFr(
        { name: 'Bench Press', id: 'ex-1' },
        [{ id: 'ex-1', name_fr: 'Développé couché' }],
      ),
    ).toBe('Développé couché')
  })
})

describe('needsExerciseCatalogLookup', () => {
  it('returns false when name_fr is already present', () => {
    expect(
      needsExerciseCatalogLookup({
        name_fr: 'Squat',
        id: 'ex-1',
      }),
    ).toBe(false)
  })

  it('returns true when only exercise id can provide name_fr', () => {
    expect(
      needsExerciseCatalogLookup({
        name_fr: null,
        id: 'ex-1',
      }),
    ).toBe(true)
  })
})

describe('resolveExerciseDisplayName', () => {
  it('returns canonical name for en locale', () => {
    expect(
      resolveExerciseDisplayName(
        { name: 'Bench Press (Barbell)', name_fr: 'Développé couché (Barre)' },
        'en',
      ),
    ).toBe('Bench Press (Barbell)')
  })

  it('uses name_fr from database in french mode', () => {
    expect(
      resolveExerciseDisplayName(
        { name: 'Bench Press (Barbell)', name_fr: 'Développé couché (Barre)' },
        'fr',
      ),
    ).toBe('Développé couché (Barre)')
  })

  it('falls back to canonical name when name_fr is absent', () => {
    expect(resolveExerciseDisplayName({ name: 'Pull Up' }, 'fr')).toBe('Pull Up')
  })
})

describe('exerciseNameMatchesQuery', () => {
  it('matches french query against name_fr', () => {
    expect(
      exerciseNameMatchesQuery(
        { name: 'Bench Press (Barbell)', name_fr: 'Développé couché (Barre)' },
        'developpe',
      ),
    ).toBe(true)
  })

  it('matches english query against canonical name', () => {
    expect(
      exerciseNameMatchesQuery(
        { name: 'Bench Press (Barbell)', name_fr: 'Développé couché (Barre)' },
        'bench',
      ),
    ).toBe(true)
  })

  it('matches accent-insensitive french fragments', () => {
    expect(
      exerciseNameMatchesQuery(
        { name: 'Lat Pulldown (Cable)', name_fr: 'Tirage vertical (Poulie)' },
        'tirage',
      ),
    ).toBe(true)
  })

  it('does not match unrelated queries', () => {
    expect(
      exerciseNameMatchesQuery(
        { name: 'Bench Press (Barbell)', name_fr: 'Développé couché (Barre)' },
        'squat',
      ),
    ).toBe(false)
  })
})

describe('translateExerciseName shim', () => {
  it('delegates to resolveExerciseDisplayName', () => {
    expect(translateExerciseName('Squat (Barbell)', 'fr', 'Squat (Barre)')).toBe(
      'Squat (Barre)',
    )
  })
})
