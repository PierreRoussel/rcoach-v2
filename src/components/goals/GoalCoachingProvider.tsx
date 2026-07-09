import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { GoalCoachingGuidanceOverlay } from '@/components/goals/GoalCoachingGuidanceOverlay'
import { GoalCoachingOptOutOverlay } from '@/components/goals/GoalCoachingOptOutOverlay'
import { GoalCoachingPromptOverlay } from '@/components/goals/GoalCoachingPromptOverlay'
import { useInsertWeightEntry, useWeightEntries } from '@/hooks/useWeightEntries'
import { useNutritionLogHistory } from '@/hooks/useNutritionStreak'
import {
  useNutritionSettings,
  useUpsertNutritionSettings,
} from '@/hooks/useNutritionSettings'
import { useMyProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useSubscriptionSummary } from '@/hooks/useSubscription'
import { useUserMeasurements } from '@/hooks/useUserMeasurements'
import { useResolvedWeightGoal } from '@/hooks/useWeightGoal'
import { useSubscriptionOverlay } from '@/components/subscription/SubscriptionLifecycleProvider'
import {
  computeObservedAvgKcal14d,
  resolveDietAdherence14d,
  shouldOfferGoalCoaching,
  suggestIntelligentCalorieAdjustment,
} from '@/lib/goals/goal-coaching-lifecycle'
import {
  GOAL_COACHING_SNOOZE_DAYS_LONG,
  GOAL_COACHING_SNOOZE_DAYS_SHORT,
  incrementGoalCoachingRefusalCount,
  markGoalCoachingCheckedToday,
  readGoalCoachingCheckedToday,
  readGoalCoachingStorage,
  resetGoalCoachingDevState,
  resetGoalCoachingRefusalCount,
  writeGoalCoachingSnooze,
} from '@/lib/goals/goal-coaching-storage'
import { WEIGHT_GOAL_TYPE_LABELS } from '@/lib/goals/weight-goal'
import { addDays, toDateKey } from '@/lib/nutrition/dates'

type OverlayPhase = 'prompt' | 'guidance' | 'opt-out' | null

const GoalCoachingDevContext = createContext<{
  forcePrompt: () => void
  resetDevState: () => void
} | null>(null)

export function useGoalCoachingDevTools() {
  const context = useContext(GoalCoachingDevContext)
  if (!context) {
    return null
  }
  return context
}

export function GoalCoachingProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const subscriptionOverlay = useSubscriptionOverlay()
  const { isPremium, isLoading: subscriptionLoading } = useSubscriptionSummary()
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: goal, isLoading: goalLoading } = useResolvedWeightGoal()
  const { data: weightEntries = [], isLoading: entriesLoading } = useWeightEntries()
  const { data: nutritionSettings, isLoading: settingsLoading } =
    useNutritionSettings()
  const { data: userMeasurements, isLoading: measurementsLoading } =
    useUserMeasurements()
  const updateProfile = useUpdateProfile()
  const insertWeightEntry = useInsertWeightEntry()
  const upsertNutrition = useUpsertNutritionSettings()

  const today = toDateKey(new Date())
  const from = addDays(today, -13)
  const dailyTarget = nutritionSettings?.daily_calorie_target ?? 2000
  const { dayMap, isLoading: historyLoading } = useNutritionLogHistory(
    from,
    today,
    dailyTarget,
  )

  const [phase, setPhase] = useState<OverlayPhase>(null)
  const [forcePrompt, setForcePrompt] = useState(false)
  const [devResetKey, setDevResetKey] = useState(0)

  const isDataLoading =
    subscriptionLoading ||
    profileLoading ||
    goalLoading ||
    entriesLoading ||
    settingsLoading ||
    measurementsLoading ||
    historyLoading

  const remindersEnabled = profile?.goal_coaching_reminders_enabled ?? true

  const dietAdherence = useMemo(
    () => resolveDietAdherence14d(dayMap),
    [dayMap],
  )

  const observedAvgKcal = useMemo(
    () => computeObservedAvgKcal14d(dayMap),
    [dayMap],
  )

  const calorieSuggestion = useMemo(() => {
    if (!nutritionSettings || !goal) {
      return null
    }

    return suggestIntelligentCalorieAdjustment(
      nutritionSettings,
      userMeasurements,
      goal,
      observedAvgKcal,
    )
  }, [goal, nutritionSettings, observedAvgKcal, userMeasurements])

  useEffect(() => {
    if (subscriptionOverlay && phase) {
      setPhase(null)
    }
  }, [phase, subscriptionOverlay])

  useEffect(() => {
    if (isDataLoading || subscriptionOverlay) {
      return
    }

    if (readGoalCoachingCheckedToday() && !forcePrompt) {
      return
    }

    markGoalCoachingCheckedToday()

    if (!goal || (goal.goal_type !== 'lose' && goal.goal_type !== 'gain')) {
      if (forcePrompt) {
        setForcePrompt(false)
      }
      return
    }

    const storage = readGoalCoachingStorage()
    const shouldOffer =
      forcePrompt ||
      shouldOfferGoalCoaching({
        isPremium,
        goal,
        entries: weightEntries,
        remindersEnabled,
        storage,
      })

    if (shouldOffer) {
      setPhase('prompt')
    }

    if (forcePrompt) {
      setForcePrompt(false)
    }
  }, [
    devResetKey,
    forcePrompt,
    goal,
    isDataLoading,
    isPremium,
    remindersEnabled,
    subscriptionOverlay,
    weightEntries,
  ])

  function handlePromptDismiss() {
    const refusalCount = incrementGoalCoachingRefusalCount()
    writeGoalCoachingSnooze(GOAL_COACHING_SNOOZE_DAYS_SHORT)

    if (refusalCount >= 2) {
      setPhase('opt-out')
      return
    }

    setPhase(null)
  }

  function handleOptOutPermanent() {
    if (profile?.id) {
      void updateProfile.mutateAsync({
        profileId: profile.id,
        changes: { goal_coaching_reminders_enabled: false },
      })
    }

    resetGoalCoachingRefusalCount()
    setPhase(null)
  }

  function handleOptOutPause() {
    writeGoalCoachingSnooze(GOAL_COACHING_SNOOZE_DAYS_LONG)
    resetGoalCoachingRefusalCount()
    setPhase(null)
  }

  async function handleConfirmWeight(weightKg: number) {
    if (!goal || weightKg === goal.current_weight_kg) {
      return
    }

    await insertWeightEntry.mutateAsync({
      weight_kg: weightKg,
      source: 'goal-coaching',
    })
  }

  async function handleApplyCalories(calories: number) {
    await upsertNutrition.mutateAsync({
      daily_calorie_target: calories,
    })
  }

  const devTools = useMemo(
    () => ({
      forcePrompt: () => setForcePrompt(true),
      resetDevState: () => {
        resetGoalCoachingDevState()
        setPhase(null)
        setDevResetKey((current) => current + 1)
      },
    }),
    [],
  )

  const goalLabel =
    goal && (goal.goal_type === 'lose' || goal.goal_type === 'gain')
      ? WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]
      : 'objectif'

  return (
    <GoalCoachingDevContext.Provider value={devTools}>
      {children}
      {goal && phase === 'prompt' ? (
        <GoalCoachingPromptOverlay
          open
          goalLabel={goalLabel}
          onAccept={() => setPhase('guidance')}
          onDismiss={handlePromptDismiss}
        />
      ) : null}
      {goal && phase === 'guidance' ? (
        <GoalCoachingGuidanceOverlay
          open
          goal={goal}
          dietAdherence={dietAdherence}
          calorieSuggestion={calorieSuggestion}
          isSavingWeight={insertWeightEntry.isPending}
          isSavingCalories={upsertNutrition.isPending}
          onClose={() => setPhase(null)}
          onConfirmWeight={handleConfirmWeight}
          onApplyCalories={handleApplyCalories}
        />
      ) : null}
      {phase === 'opt-out' ? (
        <GoalCoachingOptOutOverlay
          open
          onOptOut={handleOptOutPermanent}
          onPause={handleOptOutPause}
        />
      ) : null}
    </GoalCoachingDevContext.Provider>
  )
}
