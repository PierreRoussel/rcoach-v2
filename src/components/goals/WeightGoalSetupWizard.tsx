import { useEffect, useState } from 'react'

import { WeightGoalCalorieDialog } from '@/components/goals/WeightGoalCalorieDialog'
import {
  createDefaultNutritionWizardState,
  NutritionBodyStep,
  NutritionMacroStep,
  NutritionMealStep,
  patchMacroDistribution,
  patchMealDistribution,
  type NutritionWizardFormState,
} from '@/components/goals/NutritionWizardSteps'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInsertWeightEntry } from '@/hooks/useWeightEntries'
import {
  useNutritionSettings,
  useUpsertNutritionSettings,
} from '@/hooks/useNutritionSettings'
import {
  useUpdateWeightGoal,
  useUpsertWeightGoal,
  useWeightGoal,
} from '@/hooks/useWeightGoal'
import {
  formatWeightKg,
  inferWeightGoalType,
  suggestCalorieTarget,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'
import { calculateTdee } from '@/lib/nutrition/tdee'
import type { NutritionSettings } from '@/lib/nutrition/types'

type WeightGoalSetupWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  onCompleted?: () => void
}

const STEP_LABELS = [
  'Données corporelles',
  'Macros',
  'Repas',
  'Objectif poids',
]

export function WeightGoalSetupWizard({
  open,
  onOpenChange,
  mode,
  onCompleted,
}: WeightGoalSetupWizardProps) {
  const { data: existingGoal } = useWeightGoal()
  const { data: nutritionSettings } = useNutritionSettings()
  const upsertNutrition = useUpsertNutritionSettings()
  const upsertGoal = useUpsertWeightGoal()
  const updateGoal = useUpdateWeightGoal()
  const insertWeightEntry = useInsertWeightEntry()

  const [step, setStep] = useState(0)
  const [formState, setFormState] = useState<NutritionWizardFormState>(
    createDefaultNutritionWizardState,
  )
  const [targetWeight, setTargetWeight] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [calorieDialogOpen, setCalorieDialogOpen] = useState(false)
  const [pendingCalorieSuggestion, setPendingCalorieSuggestion] = useState<{
    suggestedCalories: number
    tdee: number
    goalType: 'lose' | 'maintain' | 'gain'
    previousCalories: number
  } | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setStep(0)
    setError(null)
    setCalorieDialogOpen(false)
    setPendingCalorieSuggestion(null)

    if (nutritionSettings) {
      setFormState({
        sex: nutritionSettings.sex ?? 'male',
        age: nutritionSettings.age != null ? String(nutritionSettings.age) : '30',
        heightCm:
          nutritionSettings.height_cm != null
            ? String(nutritionSettings.height_cm)
            : '175',
        weightKg:
          nutritionSettings.weight_kg != null
            ? String(nutritionSettings.weight_kg)
            : existingGoal
              ? String(existingGoal.current_weight_kg)
              : '75',
        activityLevel: nutritionSettings.activity_level ?? 'moderate',
        goal: nutritionSettings.goal ?? 'maintain',
        dailyCalories: String(nutritionSettings.daily_calorie_target ?? 2200),
        macroDistribution: {
          carbs: nutritionSettings.carbs_pct ?? 40,
          protein: nutritionSettings.protein_pct ?? 30,
          fat: nutritionSettings.fat_pct ?? 30,
        },
        mealDistribution: {
          breakfast: nutritionSettings.breakfast_pct ?? 20,
          lunch: nutritionSettings.lunch_pct ?? 35,
          snack: nutritionSettings.snack_pct ?? 10,
          dinner: nutritionSettings.dinner_pct ?? 35,
        },
      })
    } else {
      setFormState(createDefaultNutritionWizardState())
    }

    setTargetWeight(
      existingGoal ? String(existingGoal.target_weight_kg) : '',
    )
  }, [open, nutritionSettings, existingGoal])

  useEffect(() => {
    if (!open) {
      return
    }

    const tdee = calculateTdee({
      sex: formState.sex,
      age: Number(formState.age) || 30,
      heightCm: Number(formState.heightCm) || 175,
      weightKg: Number(formState.weightKg) || 75,
      activityLevel: formState.activityLevel,
      goal: formState.goal,
    })

    setFormState((current) => ({
      ...current,
      dailyCalories: String(tdee.dailyTarget),
    }))
  }, [
    open,
    formState.sex,
    formState.age,
    formState.heightCm,
    formState.weightKg,
    formState.activityLevel,
    formState.goal,
  ])

  const currentWeight = Number(formState.weightKg.replace(',', '.'))
  const parsedTarget = Number(targetWeight.replace(',', '.'))
  const inferredGoalType =
    Number.isFinite(currentWeight) && Number.isFinite(parsedTarget)
      ? inferWeightGoalType(currentWeight, parsedTarget)
      : null

  const tdeePreview = calculateTdee({
    sex: formState.sex,
    age: Number(formState.age) || 30,
    heightCm: Number(formState.heightCm) || 175,
    weightKg: Number(formState.weightKg) || 75,
    activityLevel: formState.activityLevel,
    goal: formState.goal,
  })

  async function saveNutritionSettings(): Promise<NutritionSettings> {
    const tdee = calculateTdee({
      sex: formState.sex,
      age: Number(formState.age),
      heightCm: Number(formState.heightCm),
      weightKg: Number(formState.weightKg),
      activityLevel: formState.activityLevel,
      goal: formState.goal,
    })

    const payload: Partial<NutritionSettings> = {
      sex: formState.sex,
      age: Number(formState.age),
      height_cm: Number(formState.heightCm),
      weight_kg: Number(formState.weightKg),
      activity_level: formState.activityLevel,
      goal: formState.goal,
      calorie_adjustment: 0,
      tdee_calculated: tdee.tdee,
      daily_calorie_target: Number(formState.dailyCalories),
      carbs_pct: formState.macroDistribution.carbs,
      protein_pct: formState.macroDistribution.protein,
      fat_pct: formState.macroDistribution.fat,
      breakfast_pct: formState.mealDistribution.breakfast,
      lunch_pct: formState.mealDistribution.lunch,
      snack_pct: formState.mealDistribution.snack,
      dinner_pct: formState.mealDistribution.dinner,
      onboarded_at: nutritionSettings?.onboarded_at ?? new Date().toISOString(),
    }

    return upsertNutrition.mutateAsync(payload) as Promise<NutritionSettings>
  }

  async function handleFinish() {
    setError(null)

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError('Indiquez un poids cible valide.')
      return
    }

    if (!Number.isFinite(currentWeight) || currentWeight <= 0) {
      setError('Indiquez un poids actuel valide.')
      return
    }

    const weightGoalType = inferWeightGoalType(currentWeight, parsedTarget)
    const previousCalories =
      nutritionSettings?.daily_calorie_target ?? Number(formState.dailyCalories)

    try {
      const savedSettings = await saveNutritionSettings()

      if (mode === 'edit' && existingGoal) {
        const nextGoalType = inferWeightGoalType(
          existingGoal.start_weight_kg,
          parsedTarget,
        )
        const weightChanged = currentWeight !== existingGoal.current_weight_kg

        await updateGoal.mutateAsync({
          target_weight_kg: parsedTarget,
          goal_type: nextGoalType,
          ...(weightChanged ? { current_weight_kg: currentWeight } : {}),
        })

        if (weightChanged) {
          await insertWeightEntry.mutateAsync({
            weight_kg: currentWeight,
            source: 'adjust',
          })
        }
      } else {
        await upsertGoal.mutateAsync({
          target_weight_kg: parsedTarget,
          start_weight_kg: currentWeight,
          current_weight_kg: currentWeight,
          goal_type: weightGoalType,
          last_milestone_step: 0,
        })

        await insertWeightEntry.mutateAsync({
          weight_kg: currentWeight,
          source: 'goal_start',
        })
      }

      const suggestion = suggestCalorieTarget(
        savedSettings,
        weightGoalType,
        currentWeight,
      )

      const fallbackTdee = calculateTdee({
        sex: formState.sex,
        age: Number(formState.age),
        heightCm: Number(formState.heightCm),
        weightKg: currentWeight,
        activityLevel: formState.activityLevel,
        goal: weightGoalType,
      })

      setPendingCalorieSuggestion({
        suggestedCalories:
          suggestion?.suggestedCalories ?? fallbackTdee.dailyTarget,
        tdee: suggestion?.tdee ?? fallbackTdee.tdee,
        goalType: weightGoalType,
        previousCalories,
      })
      setCalorieDialogOpen(true)
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : 'Impossible de sauvegarder l’objectif.',
      )
    }
  }

  async function applyCalorieSuggestion(accept: boolean) {
    if (!pendingCalorieSuggestion) {
      setCalorieDialogOpen(false)
      onOpenChange(false)
      onCompleted?.()
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
    onOpenChange(false)
    onCompleted?.()
  }

  const isSaving =
    upsertNutrition.isPending ||
    upsertGoal.isPending ||
    updateGoal.isPending ||
    insertWeightEntry.isPending

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-black">
              {mode === 'edit' ? 'Modifier l’objectif' : 'Configurer mon objectif'}
            </DialogTitle>
            <DialogDescription>
              Étape {step + 1} sur 4 — {STEP_LABELS[step]}
            </DialogDescription>
          </DialogHeader>

          {step === 0 ? (
            <NutritionBodyStep
              state={formState}
              onChange={(patch) =>
                setFormState((current) => ({ ...current, ...patch }))
              }
            />
          ) : null}

          {step === 1 ? (
            <NutritionMacroStep
              state={formState}
              onMacroChange={(key, value) => {
                setFormState((current) => ({
                  ...current,
                  macroDistribution: patchMacroDistribution(
                    current.macroDistribution,
                    key,
                    value,
                  ),
                }))
              }}
            />
          ) : null}

          {step === 2 ? (
            <NutritionMealStep
              state={formState}
              onMealChange={(key, value) => {
                setFormState((current) => ({
                  ...current,
                  mealDistribution: patchMealDistribution(
                    current.mealDistribution,
                    key,
                    value,
                  ),
                }))
              }}
            />
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Poids actuel :{' '}
                <span className="font-medium text-foreground">
                  {Number.isFinite(currentWeight)
                    ? formatWeightKg(currentWeight)
                    : '—'}
                </span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="wizardTargetWeight">Poids cible (kg)</Label>
                <Input
                  id="wizardTargetWeight"
                  inputMode="decimal"
                  placeholder="Ex. 70"
                  value={targetWeight}
                  onChange={(event) => setTargetWeight(event.target.value)}
                />
              </div>
              {inferredGoalType ? (
                <p className="text-sm text-muted-foreground">
                  Type d’objectif :{' '}
                  <span className="font-medium text-foreground">
                    {WEIGHT_GOAL_TYPE_LABELS[inferredGoalType]}
                  </span>
                </p>
              ) : null}
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">TDEE estimé</span>
                  <span className="font-semibold">{tdeePreview.tdee} kcal/j</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Objectif calorique</span>
                  <span className="font-semibold">
                    {formState.dailyCalories} kcal/j
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {tdeePreview.tdee - Number(formState.dailyCalories) >= 0
                      ? 'Déficit'
                      : 'Surplus'}{' '}
                    journalier
                  </span>
                  <span className="font-semibold text-primary">
                    {Math.abs(
                      tdeePreview.tdee - Number(formState.dailyCalories),
                    )}{' '}
                    kcal/j
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((value) => value - 1)}
              >
                Retour
              </Button>
            </div>
            {step < 3 ? (
              <Button type="button" onClick={() => setStep((value) => value + 1)}>
                Continuer
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleFinish()}
                disabled={isSaving}
              >
                {mode === 'edit' ? 'Enregistrer' : 'Définir l’objectif'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingCalorieSuggestion ? (
        <WeightGoalCalorieDialog
          open={calorieDialogOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              void applyCalorieSuggestion(false)
            }
          }}
          currentCalories={pendingCalorieSuggestion.previousCalories}
          suggestedCalories={pendingCalorieSuggestion.suggestedCalories}
          goalLabel={WEIGHT_GOAL_TYPE_LABELS[pendingCalorieSuggestion.goalType]}
          isSaving={upsertNutrition.isPending}
          onAccept={() => void applyCalorieSuggestion(true)}
          onDecline={() => void applyCalorieSuggestion(false)}
        />
      ) : null}
    </>
  )
}
