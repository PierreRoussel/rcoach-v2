import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import { resolveExerciseDisplayName } from '@/lib/workout/translate-exercise-name'
import type { ExerciseNameSource } from '@/lib/workout/translate-exercise-name'

export function useExerciseDisplayName(
  canonicalName: string | null | undefined,
  nameFr?: string | null,
): string {
  const locale = useExerciseLocale()

  if (!canonicalName) {
    return ''
  }

  return resolveExerciseDisplayName({ name: canonicalName, name_fr: nameFr }, locale)
}

export function useExerciseDisplayNameFromExercise(
  exercise: ExerciseNameSource | null | undefined,
): string {
  const locale = useExerciseLocale()

  if (!exercise?.name) {
    return ''
  }

  return resolveExerciseDisplayName(exercise, locale)
}
