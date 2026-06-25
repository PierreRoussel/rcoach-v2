import { useState } from 'react'
import { Minus, Plus, Target } from 'lucide-react'

import { WeightGoalCalorieDialog } from '@/components/goals/WeightGoalCalorieDialog'
import { WeightMilestoneOverlay } from '@/components/goals/WeightMilestoneOverlay'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useNutritionSettings,
  useUpsertNutritionSettings,
} from '@/hooks/useNutritionSettings'
import {
  useDeleteWeightGoal,
  useUpdateWeightGoal,
  useUpsertWeightGoal,
  useWeightGoal,
} from '@/hooks/useWeightGoal'
import {
  adjustWeightKg,
  formatProgressSinceStart,
  formatWeightKg,
  inferWeightGoalType,
  milestoneStepFromProgress,
  progressKgSinceStart,
  shouldSuggestCalorieUpdate,
  suggestCalorieTarget,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'

type PendingCalorieSuggestion = {
  suggestedCalories: number
  tdee: number
  goalType: 'lose' | 'maintain' | 'gain'
}

export function GoalsSection() {
  const { data: goal, isLoading: goalLoading } = useWeightGoal()
  const { data: nutritionSettings } = useNutritionSettings()
  const upsertGoal = useUpsertWeightGoal()
  const updateGoal = useUpdateWeightGoal()
  const deleteGoal = useDeleteWeightGoal()
  const upsertNutrition = useUpsertNutritionSettings()

  const [targetWeight, setTargetWeight] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [calorieDialogOpen, setCalorieDialogOpen] = useState(false)
  const [pendingCalorieSuggestion, setPendingCalorieSuggestion] =
    useState<PendingCalorieSuggestion | null>(null)
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null)
  const [milestoneOpen, setMilestoneOpen] = useState(false)

  const resolvedCurrentWeight =
    nutritionSettings?.weight_kg != null
      ? String(nutritionSettings.weight_kg)
      : currentWeight

  function resetSetupForm() {
    setTargetWeight(goal ? String(goal.target_weight_kg) : '')
    setCurrentWeight(
      nutritionSettings?.weight_kg != null
        ? String(nutritionSettings.weight_kg)
        : goal
          ? String(goal.current_weight_kg)
          : '',
    )
    setError(null)
  }

  async function applyCalorieSuggestion(accept: boolean) {
    if (!pendingCalorieSuggestion || !nutritionSettings) {
      setCalorieDialogOpen(false)
      setPendingCalorieSuggestion(null)
      return
    }

    if (accept) {
      try {
        await upsertNutrition.mutateAsync({
          goal: pendingCalorieSuggestion.goalType,
          daily_calorie_target: pendingCalorieSuggestion.suggestedCalories,
          tdee_calculated: pendingCalorieSuggestion.tdee,
        })
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible de mettre à jour les calories.',
        )
        return
      }
    }

    setCalorieDialogOpen(false)
    setPendingCalorieSuggestion(null)
    setIsEditingGoal(false)
  }

  async function handleSetGoal() {
    setError(null)

    const target = Number(targetWeight.replace(',', '.'))
    const start = Number(resolvedCurrentWeight.replace(',', '.'))

    if (!Number.isFinite(target) || target <= 0) {
      setError('Indiquez un poids cible valide.')
      return
    }

    if (!Number.isFinite(start) || start <= 0) {
      setError('Indiquez votre poids actuel.')
      return
    }

    const goalType = inferWeightGoalType(start, target)

    try {
      if (goal && isEditingGoal) {
        const nextGoalType = inferWeightGoalType(goal.start_weight_kg, target)

        await updateGoal.mutateAsync({
          target_weight_kg: target,
          goal_type: nextGoalType,
        })

        const suggestion = nutritionSettings
          ? suggestCalorieTarget(
              nutritionSettings,
              nextGoalType,
              goal.current_weight_kg,
            )
          : null

        if (suggestion && shouldSuggestCalorieUpdate(suggestion)) {
          setPendingCalorieSuggestion({
            suggestedCalories: suggestion.suggestedCalories,
            tdee: suggestion.tdee,
            goalType: nextGoalType,
          })
          setCalorieDialogOpen(true)
        } else {
          setIsEditingGoal(false)
        }

        return
      }

      await upsertGoal.mutateAsync({
        target_weight_kg: target,
        start_weight_kg: start,
        current_weight_kg: start,
        goal_type: goalType,
        last_milestone_step: 0,
      })

      if (nutritionSettings?.weight_kg !== start) {
        await upsertNutrition.mutateAsync({ weight_kg: start })
      }

      const suggestion = nutritionSettings
        ? suggestCalorieTarget(nutritionSettings, goalType, start)
        : null

      if (suggestion && shouldSuggestCalorieUpdate(suggestion)) {
        setPendingCalorieSuggestion({
          suggestedCalories: suggestion.suggestedCalories,
          tdee: suggestion.tdee,
          goalType,
        })
        setCalorieDialogOpen(true)
      } else {
        setIsEditingGoal(false)
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible de sauvegarder l’objectif.',
      )
    }
  }

  async function handleAdjustWeight(deltaSteps: number) {
    if (!goal) {
      return
    }

    setError(null)

    const nextWeight = adjustWeightKg(goal.current_weight_kg, deltaSteps)
    const previewGoal = { ...goal, current_weight_kg: nextWeight }
    const progress = progressKgSinceStart(previewGoal)
    const nextStep = milestoneStepFromProgress(progress, goal.goal_type)
    const reachedNewMilestone = nextStep > goal.last_milestone_step

    try {
      await updateGoal.mutateAsync({
        current_weight_kg: nextWeight,
        ...(reachedNewMilestone ? { last_milestone_step: nextStep } : {}),
      })

      if (nutritionSettings) {
        await upsertNutrition.mutateAsync({ weight_kg: nextWeight })
      }

      if (reachedNewMilestone && goal.goal_type !== 'maintain') {
        setMilestoneCount(nextStep)
        setMilestoneOpen(true)
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible de mettre à jour le poids.',
      )
    }
  }

  async function handleRemoveGoal() {
    setError(null)

    try {
      await deleteGoal.mutateAsync()
      setIsEditingGoal(false)
      resetSetupForm()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible de supprimer l’objectif.',
      )
    }
  }

  if (goalLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des objectifs...</p>
  }

  const previewStart = Number(resolvedCurrentWeight.replace(',', '.'))
  const previewTarget = Number(targetWeight.replace(',', '.'))
  const previewGoalType =
    Number.isFinite(previewStart) && Number.isFinite(previewTarget)
      ? inferWeightGoalType(previewStart, previewTarget)
      : null

  return (
    <>
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display font-black">Objectifs</CardTitle>
              <CardDescription>
                Suivez votre poids et progressez vers votre cible.
              </CardDescription>
            </div>
            <Target className="size-5 text-primary" aria-hidden />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {goal && !isEditingGoal ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]}
                </span>
                <span className="text-xs text-muted-foreground">
                  Cible : {formatWeightKg(goal.target_weight_kg)}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Poids actuel</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={updateGoal.isPending}
                    onClick={() => void handleAdjustWeight(-1)}
                    aria-label="Diminuer le poids de 500 g"
                  >
                    <Minus className="size-4" />
                  </Button>

                  <div className="text-center">
                    <p className="font-display text-3xl font-black">
                      {formatWeightKg(goal.current_weight_kg)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatProgressSinceStart(goal)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    disabled={updateGoal.isPending}
                    onClick={() => void handleAdjustWeight(1)}
                    aria-label="Augmenter le poids de 500 g"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Ajustements par pas de 500 g
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    resetSetupForm()
                    setIsEditingGoal(true)
                  }}
                >
                  Modifier l’objectif
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground"
                  disabled={deleteGoal.isPending}
                  onClick={() => void handleRemoveGoal()}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {nutritionSettings?.weight_kg == null ? (
                <div className="space-y-2">
                  <Label htmlFor="currentWeightGoal">Poids actuel (kg)</Label>
                  <Input
                    id="currentWeightGoal"
                    inputMode="decimal"
                    placeholder="Ex. 75,5"
                    value={currentWeight}
                    onChange={(event) => setCurrentWeight(event.target.value)}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Poids actuel : {formatWeightKg(nutritionSettings.weight_kg)}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetWeightGoal">Poids cible (kg)</Label>
                <Input
                  id="targetWeightGoal"
                  inputMode="decimal"
                  placeholder="Ex. 70"
                  value={targetWeight}
                  onChange={(event) => setTargetWeight(event.target.value)}
                />
              </div>

              {previewGoalType ? (
                <p className="text-sm text-muted-foreground">
                  Type d’objectif détecté :{' '}
                  <span className="font-medium text-foreground">
                    {WEIGHT_GOAL_TYPE_LABELS[previewGoalType]}
                  </span>
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-full"
                  disabled={upsertGoal.isPending}
                  onClick={() => void handleSetGoal()}
                >
                  {goal ? 'Mettre à jour' : 'Définir l’objectif'}
                </Button>
                {goal ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      setIsEditingGoal(false)
                      resetSetupForm()
                    }}
                  >
                    Annuler
                  </Button>
                ) : null}
              </div>
            </div>
          )}

          {error ? <FormMessage>{error}</FormMessage> : null}
        </CardContent>
      </Card>

      {pendingCalorieSuggestion && nutritionSettings ? (
        <WeightGoalCalorieDialog
          open={calorieDialogOpen}
          onOpenChange={setCalorieDialogOpen}
          currentCalories={nutritionSettings.daily_calorie_target}
          suggestedCalories={pendingCalorieSuggestion.suggestedCalories}
          goalLabel={WEIGHT_GOAL_TYPE_LABELS[pendingCalorieSuggestion.goalType]}
          isSaving={upsertNutrition.isPending}
          onAccept={() => void applyCalorieSuggestion(true)}
          onDecline={() => void applyCalorieSuggestion(false)}
        />
      ) : null}

      <WeightMilestoneOverlay
        open={milestoneOpen}
        milestoneCount={milestoneCount ?? 0}
        goalLabel={
          goal ? WEIGHT_GOAL_TYPE_LABELS[goal.goal_type] : 'progression'
        }
        onClose={() => {
          setMilestoneOpen(false)
          setMilestoneCount(null)
        }}
      />
    </>
  )
}
