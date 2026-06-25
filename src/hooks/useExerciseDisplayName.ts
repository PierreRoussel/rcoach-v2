import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import { translateExerciseName } from '@/lib/workout/translate-exercise-name'

export function useExerciseDisplayName(
  canonicalName: string | null | undefined,
): string {
  const locale = useExerciseLocale()

  if (!canonicalName) {
    return ''
  }

  return translateExerciseName(canonicalName, locale)
}
