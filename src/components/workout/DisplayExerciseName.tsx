import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'

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
