import { HoldTimerBar } from '@/components/workout/HoldTimerBar'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export function ActiveWorkoutHoldTimerOverlay() {
  const isHolding = useActiveWorkoutStore((state) => state.isHolding)
  const holdSecondsLeft = useActiveWorkoutStore((state) => state.holdSecondsLeft)
  const holdTargetSeconds = useActiveWorkoutStore((state) => state.holdTargetSeconds)
  const holdingStep = useActiveWorkoutStore((state) => state.holdingStep)
  const exercises = useActiveWorkoutStore((state) => state.exercises)
  const stopHold = useActiveWorkoutStore((state) => state.stopHold)

  const holdingExercise =
    holdingStep != null ? exercises[holdingStep.exerciseIndex] ?? null : null
  const holdDisplayName = useExerciseDisplayName(
    holdingExercise?.exerciseName,
    holdingExercise?.exerciseNameFr,
    holdingExercise?.exerciseId,
  )
  const holdExerciseLabel = holdingExercise
    ? `${holdDisplayName} — série ${(holdingStep?.setIndex ?? 0) + 1}`
    : null

  if (!isHolding) {
    return null
  }

  return (
    <HoldTimerBar
      holdSecondsLeft={holdSecondsLeft}
      holdTargetSeconds={holdTargetSeconds}
      exerciseLabel={holdExerciseLabel}
      onStop={() => void stopHold()}
    />
  )
}
