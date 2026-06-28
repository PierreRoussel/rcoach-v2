import { useCallback, useState } from 'react'

import { useInsertWeightEntry } from '@/hooks/useWeightEntries'
import { useUpdateWeightGoal } from '@/hooks/useWeightGoal'
import {
  adjustWeightKg,
  isWeightGoalReached,
  milestoneStepFromProgress,
  progressKgSinceStart,
  type WeightGoal,
} from '@/lib/goals/weight-goal'

type UseAdjustWeightGoalOptions = {
  onMilestone?: (milestoneCount: number) => void
  onGoalReached?: (goal: WeightGoal) => void
}

export function useAdjustWeightGoal(options: UseAdjustWeightGoalOptions = {}) {
  const updateGoal = useUpdateWeightGoal()
  const insertWeightEntry = useInsertWeightEntry()
  const [error, setError] = useState<string | null>(null)

  const onMilestone = options.onMilestone
  const onGoalReached = options.onGoalReached

  const adjustWeight = useCallback(
    async (goal: WeightGoal, deltaSteps: number) => {
      setError(null)

      const nextWeight = adjustWeightKg(goal.current_weight_kg, deltaSteps)
      const previewGoal = { ...goal, current_weight_kg: nextWeight }
      const progress = progressKgSinceStart(previewGoal)
      const nextStep = milestoneStepFromProgress(progress, goal.goal_type)
      const reachedNewMilestone = nextStep > goal.last_milestone_step
      const justReachedGoal =
        goal.goal_type !== 'maintain' &&
        !isWeightGoalReached(goal) &&
        isWeightGoalReached(previewGoal)

      try {
        if (reachedNewMilestone) {
          await updateGoal.mutateAsync({ last_milestone_step: nextStep })
        }

        await insertWeightEntry.mutateAsync({
          weight_kg: nextWeight,
          source: 'adjust',
        })

        if (justReachedGoal) {
          onGoalReached?.({ ...goal, current_weight_kg: nextWeight })
        } else if (reachedNewMilestone && goal.goal_type !== 'maintain') {
          onMilestone?.(nextStep)
        }
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible de mettre à jour le poids.',
        )
      }
    },
    [insertWeightEntry, onGoalReached, onMilestone, updateGoal],
  )

  return {
    adjustWeight,
    isPending: updateGoal.isPending || insertWeightEntry.isPending,
    error,
    setError,
  }
}
