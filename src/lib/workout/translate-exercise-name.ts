import {
  EXERCISE_TRANSLATIONS,
  type ExerciseLocale,
} from '@/lib/workout/exercise-translations'

export const DEFAULT_EXERCISE_LOCALE: ExerciseLocale = 'fr'

export function translateExerciseName(
  canonicalName: string,
  locale: ExerciseLocale,
): string {
  if (!canonicalName.trim()) {
    return canonicalName
  }

  if (locale === 'en') {
    return canonicalName
  }

  const entry = EXERCISE_TRANSLATIONS[canonicalName]?.[locale]
  if (entry === undefined) {
    return canonicalName
  }

  if (entry === null) {
    return canonicalName
  }

  return entry
}

export function exerciseNameMatchesQuery(
  canonicalName: string,
  query: string,
  locale: ExerciseLocale,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const displayName = translateExerciseName(canonicalName, locale)
  return (
    canonicalName.toLowerCase().includes(normalized) ||
    displayName.toLowerCase().includes(normalized)
  )
}
