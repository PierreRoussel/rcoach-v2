import { useCallback, useEffect, useState } from 'react'

import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useUserMeasurements } from '@/hooks/useUserMeasurements'
import {
  createPreviewWeightGoalSetupPayload,
  type WeightGoalSetupCelebrationPayload,
  type WeightGoalSetupCompletedEvent,
} from '@/lib/goals/weight-goal-setup-celebration'

type UseWeightGoalSetupCelebrationOptions = {
  previewGoalType?: 'lose' | 'gain' | null
}

export function useWeightGoalSetupCelebration(
  options?: UseWeightGoalSetupCelebrationOptions,
) {
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: userMeasurements } = useUserMeasurements()
  const [payload, setPayload] = useState<WeightGoalSetupCelebrationPayload | null>(
    null,
  )
  const [open, setOpen] = useState(false)

  const isPreview = options?.previewGoalType != null

  useEffect(() => {
    if (!options?.previewGoalType) {
      return
    }

    setPayload(createPreviewWeightGoalSetupPayload(options.previewGoalType))
    setOpen(true)
  }, [options?.previewGoalType])

  const onWizardCompleted = useCallback((result?: WeightGoalSetupCompletedEvent) => {
    if (result?.showCelebration && result.payload) {
      setPayload(result.payload)
      setOpen(true)
    }
  }, [])

  const closeSetupCelebration = useCallback(() => {
    setOpen(false)
    if (!isPreview) {
      setPayload(null)
    }
  }, [isPreview])

  return {
    setupCelebrationPayload: payload,
    setupCelebrationOpen: open && payload != null,
    isSetupCelebrationPreview: isPreview,
    nutritionSettings,
    userMeasurements,
    onWizardCompleted,
    closeSetupCelebration,
  }
}
