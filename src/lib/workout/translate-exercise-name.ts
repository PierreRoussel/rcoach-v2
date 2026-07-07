import type { ExerciseLocale } from '@/lib/workout/exercise-locale'

export type { ExerciseLocale } from '@/lib/workout/exercise-locale'
export { DEFAULT_EXERCISE_LOCALE } from '@/lib/workout/exercise-locale'

export type ExerciseNameSource = {
  name: string
  name_fr?: string | null
}

export type ExerciseDisplayInput = ExerciseNameSource & {
  id?: string | null
}

export type ExerciseCatalogNameSource = Pick<ExerciseNameSource, 'name_fr'> & {
  id: string
}

export function needsExerciseCatalogLookup(
  exercise: Pick<ExerciseDisplayInput, 'name_fr' | 'id'>,
): boolean {
  if (exercise.name_fr?.trim()) {
    return false
  }

  return Boolean(exercise.id)
}

export function resolveExerciseNameFr(
  exercise: ExerciseDisplayInput,
  catalog?: ReadonlyArray<ExerciseCatalogNameSource> | null,
): string | null {
  const storedFrench = exercise.name_fr?.trim()
  if (storedFrench) {
    return storedFrench
  }

  if (!exercise.id || !catalog?.length) {
    return null
  }

  return catalog.find((entry) => entry.id === exercise.id)?.name_fr?.trim() ?? null
}

export function resolveExerciseDisplayName(
  exercise: ExerciseNameSource,
  locale: ExerciseLocale,
): string {
  const canonicalName = exercise.name.trim()
  if (!canonicalName) {
    return ''
  }

  if (locale === 'en') {
    return canonicalName
  }

  const storedFrench = exercise.name_fr?.trim()
  if (storedFrench) {
    return storedFrench
  }

  return canonicalName
}

/** @deprecated Préférez resolveExerciseDisplayName avec name_fr depuis la base. */
export function translateExerciseName(
  canonicalName: string,
  locale: ExerciseLocale,
  nameFr?: string | null,
): string {
  return resolveExerciseDisplayName({ name: canonicalName, name_fr: nameFr }, locale)
}

function foldAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function exerciseNameMatchesQuery(
  exercise: ExerciseNameSource,
  query: string,
): boolean {
  const normalized = foldAccents(query.trim())
  if (!normalized) {
    return true
  }

  const candidates = [exercise.name.trim()]
  const french = exercise.name_fr?.trim()
  if (french) {
    candidates.push(french)
  }

  return candidates.some((candidate) => foldAccents(candidate).includes(normalized))
}
