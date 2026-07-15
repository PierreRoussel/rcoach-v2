import { useMemo } from 'react'

import { RestTimerBar } from '@/components/workout/RestTimerBar'
import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import {
  buildCircuitSteps,
  findNextStepIndexAfter,
  getStepLabel,
} from '@/lib/workout/workout-circuit'

export function ActiveWorkoutRestTimerOverlay() {
  const isResting = useActiveWorkoutStore((state) => state.isResting)
  const restSecondsLeft = useActiveWorkoutStore((state) => state.restSecondsLeft)
  const restTargetSeconds = useActiveWorkoutStore((state) => state.restTargetSeconds)
  const exercises = useActiveWorkoutStore((state) => state.exercises)
  const lastCompletedStep = useActiveWorkoutStore((state) => state.lastCompletedStep)
  const adjustRest = useActiveWorkoutStore((state) => state.adjustRest)
  const skipRest = useActiveWorkoutStore((state) => state.skipRest)
  const exerciseLocale = useExerciseLocale()

  const nextStepLabel = useMemo(() => {
    const steps = buildCircuitSteps(exercises)
    const nextIndex = findNextStepIndexAfter(steps, exercises, lastCompletedStep)
    return getStepLabel(
      exercises,
      nextIndex != null ? steps[nextIndex] ?? null : null,
      exerciseLocale,
    )
  }, [exercises, exerciseLocale, lastCompletedStep])

  if (!isResting) {
    return null
  }

  return (
    <RestTimerBar
      restSecondsLeft={restSecondsLeft}
      restTargetSeconds={restTargetSeconds}
      nextStepLabel={nextStepLabel}
      onAdjust={adjustRest}
      onSkip={skipRest}
    />
  )
}
