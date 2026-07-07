import {
  useExerciseDisplayName,
  useExerciseDisplayNameFromExercise,
  type ExerciseDisplayInput,
} from '@/hooks/useExerciseDisplayName'

type DisplayExerciseNameProps = {
  name: string | null | undefined
  nameFr?: string | null
  name_fr?: string | null
  exerciseId?: string | null
  id?: string | null
  className?: string
}

export function DisplayExerciseName({
  name,
  nameFr,
  name_fr: nameFrSnake,
  exerciseId,
  id,
  className,
}: DisplayExerciseNameProps) {
  const displayName = useExerciseDisplayName({
    name: name ?? '',
    name_fr: nameFr ?? nameFrSnake,
    id: exerciseId ?? id,
  })

  if (!displayName) {
    return null
  }

  if (className) {
    return <span className={className}>{displayName}</span>
  }

  return <>{displayName}</>
}

type DisplayExerciseProps = {
  exercise: ExerciseDisplayInput
  className?: string
}

export function DisplayExercise({ exercise, className }: DisplayExerciseProps) {
  const displayName = useExerciseDisplayNameFromExercise(exercise)

  if (!displayName) {
    return null
  }

  if (className) {
    return <span className={className}>{displayName}</span>
  }

  return <>{displayName}</>
}

export type { ExerciseDisplayInput }
