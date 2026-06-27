import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'

type DisplayExerciseNameProps = {
  name: string | null | undefined
  nameFr?: string | null
  className?: string
}

export function DisplayExerciseName({ name, nameFr, className }: DisplayExerciseNameProps) {
  const displayName = useExerciseDisplayName(name, nameFr)

  if (!displayName) {
    return null
  }

  if (className) {
    return <span className={className}>{displayName}</span>
  }

  return <>{displayName}</>
}
