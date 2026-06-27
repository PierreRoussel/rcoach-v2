import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import { useAllExercises } from '@/hooks/useExercises'
import { resolveExerciseDisplayName } from '@/lib/workout/translate-exercise-name'
import type { ExerciseNameSource } from '@/lib/workout/translate-exercise-name'

export function useExerciseDisplayName(
  canonicalName: string | null | undefined,
  nameFr?: string | null,
  exerciseId?: string | null,
): string {
  const locale = useExerciseLocale()
  const { data: exercises } = useAllExercises()

  if (!canonicalName) {
    return ''
  }

  const resolvedNameFr =
    nameFr ??
    (exerciseId
      ? (exercises?.find((exercise) => exercise.id === exerciseId)?.name_fr ?? null)
      : null)

  return resolveExerciseDisplayName(
    { name: canonicalName, name_fr: resolvedNameFr },
    locale,
  )
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
