import { describe, expect, it } from 'vitest'

import { DEFAULT_EXERCISE_LOCALE } from '@/lib/workout/exercise-translations'

function withDefaultExerciseLocale(profile: {
  id: string
  display_name: string
  exercise_locale?: 'fr' | 'en'
}) {
  return {
    ...profile,
    exercise_locale: profile.exercise_locale ?? DEFAULT_EXERCISE_LOCALE,
  }
}

describe('profile exercise_locale fallback', () => {
  it('defaults to fr when the column is missing from the response', () => {
    expect(
      withDefaultExerciseLocale({
        id: '1',
        display_name: 'Leo',
      }).exercise_locale,
    ).toBe('fr')
  })
})
