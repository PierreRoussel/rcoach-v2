import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'

type DisplayExerciseNameProps = {
  name: string | null | undefined
  className?: string
}

export function DisplayExerciseName({ name, className }: DisplayExerciseNameProps) {
  const displayName = useExerciseDisplayName(name)

  if (!displayName) {
    return null
  }

  if (className) {
    return <span className={className}>{displayName}</span>
  }

  return <>{displayName}</>
}
