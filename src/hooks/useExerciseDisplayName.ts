import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import { useAllExercises } from '@/hooks/useExercises'
import {
  needsExerciseCatalogLookup,
  resolveExerciseDisplayName,
  resolveExerciseNameFr,
  type ExerciseDisplayInput,
  type ExerciseNameSource,
} from '@/lib/workout/translate-exercise-name'

function normalizeExerciseDisplayInput(
  nameOrInput: string | ExerciseDisplayInput | null | undefined,
  nameFr?: string | null,
  exerciseId?: string | null,
): ExerciseDisplayInput | null {
  if (nameOrInput == null) {
    return null
  }

  if (typeof nameOrInput === 'object') {
    if (!nameOrInput.name?.trim()) {
      return null
    }

    return nameOrInput
  }

  if (!nameOrInput.trim()) {
    return null
  }

  return {
    name: nameOrInput,
    name_fr: nameFr,
    id: exerciseId,
  }
}

export function useExerciseDisplayName(
  nameOrInput: string | ExerciseDisplayInput | null | undefined,
  nameFr?: string | null,
  exerciseId?: string | null,
): string {
  const locale = useExerciseLocale()
  const input = normalizeExerciseDisplayInput(nameOrInput, nameFr, exerciseId)
  const needsCatalog = input != null && needsExerciseCatalogLookup(input)
  const { data: exercises } = useAllExercises({ enabled: needsCatalog })

  if (!input) {
    return ''
  }

  return resolveExerciseDisplayName(
    {
      name: input.name,
      name_fr: resolveExerciseNameFr(input, exercises),
    },
    locale,
  )
}

export function useExerciseDisplayNameFromExercise(
  exercise: ExerciseDisplayInput | null | undefined,
): string {
  return useExerciseDisplayName(exercise ?? null)
}

export type { ExerciseDisplayInput, ExerciseNameSource }
