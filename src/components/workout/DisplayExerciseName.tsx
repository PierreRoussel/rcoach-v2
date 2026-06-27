import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import type { ExerciseNameSource } from '@/lib/workout/translate-exercise-name'

type DisplayExerciseNameProps = {
  name: string | null | undefined
  nameFr?: string | null
  exerciseId?: string | null
  className?: string
}

export function DisplayExerciseName({
  name,
  nameFr,
  exerciseId,
  className,
}: DisplayExerciseNameProps) {
  const displayName = useExerciseDisplayName(name, nameFr, exerciseId)

  if (!displayName) {
    return null
  }

  if (className) {
    return <span className={className}>{displayName}</span>
  }

  return <>{displayName}</>
}

type DisplayExerciseProps = {
  exercise: ExerciseNameSource & { id?: string | null }
  className?: string
}

export function DisplayExercise({ exercise, className }: DisplayExerciseProps) {
  return (
    <DisplayExerciseName
      name={exercise.name}
      nameFr={exercise.name_fr}
      exerciseId={exercise.id}
      className={className}
    />
  )
}
