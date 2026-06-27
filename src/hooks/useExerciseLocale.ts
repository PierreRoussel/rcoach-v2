import { useMyProfile } from '@/hooks/useProfile'
import { DEFAULT_EXERCISE_LOCALE, type ExerciseLocale } from '@/lib/workout/exercise-locale'

export function useExerciseLocale(): ExerciseLocale {
  const { data: profile } = useMyProfile()
  return profile?.exercise_locale ?? DEFAULT_EXERCISE_LOCALE
}
