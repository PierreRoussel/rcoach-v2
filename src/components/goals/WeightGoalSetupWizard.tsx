import { useEffect, useRef, useState } from 'react'

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
  useUpsertUserMeasurements,
  useUserMeasurements,
} from '@/hooks/useUserMeasurements'
import {
  useUpdateWeightGoal,
  useUpsertWeightGoal,
  useWeightGoal,
} from '@/hooks/useWeightGoal'
import {
  clampWeightKg,
  formatWeightKg,
  inferWeightGoalType,
  institutionWeightSnapshot,
  isWeightGoalReinstitution,
  shouldSuggestCalorieUpdate,
  suggestCalorieTarget,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'
import { calculateTdee } from '@/lib/nutrition/tdee'
import type { NutritionSettings } from '@/lib/nutrition/types'
import { buildWizardMeasurementsUpsert } from '@/lib/onboarding/profile-form'

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
  const { data: userMeasurements } = useUserMeasurements()
  const upsertNutrition = useUpsertNutritionSettings()
  const upsertUserMeasurements = useUpsertUserMeasurements()
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

  const prevOpenRef = useRef(false)
  const hydratedForOpenRef = useRef(false)
  const calorieActionTakenRef = useRef(false)

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false
      hydratedForOpenRef.current = false
      return
    }

    const justOpened = !prevOpenRef.current
    prevOpenRef.current = true

    if (justOpened) {
      setStep(0)
      setError(null)
      setCalorieDialogOpen(false)
      setPendingCalorieSuggestion(null)
      calorieActionTakenRef.current = false
      hydratedForOpenRef.current = false
    }

    if (hydratedForOpenRef.current) {
      return
    }

    if (mode === 'edit' && (!existingGoal || !nutritionSettings)) {
      return
    }

    hydratedForOpenRef.current = true

    if (nutritionSettings || userMeasurements) {
      setFormState({
        sex: userMeasurements?.sex ?? nutritionSettings?.sex ?? 'male',
        age:
          userMeasurements?.age != null
            ? String(userMeasurements.age)
            : nutritionSettings?.age != null
              ? String(nutritionSettings.age)
              : '30',
        heightCm:
          userMeasurements?.height_cm != null
            ? String(userMeasurements.height_cm)
            : nutritionSettings?.height_cm != null
              ? String(nutritionSettings.height_cm)
              : '175',
        weightKg:
          existingGoal != null
            ? String(existingGoal.current_weight_kg)
            : nutritionSettings?.weight_kg != null
              ? String(nutritionSettings.weight_kg)
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

    setTargetWeight(existingGoal ? String(existingGoal.target_weight_kg) : '')
  }, [open, mode, existingGoal, nutritionSettings, userMeasurements])

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

  async function saveWizardData(): Promise<NutritionSettings> {
    await upsertUserMeasurements.mutateAsync(
      buildWizardMeasurementsUpsert({
        sex: formState.sex,
        age: formState.age,
        heightCm: formState.heightCm,
      }),
    )

    const tdee = calculateTdee({
      sex: formState.sex,
      age: Number(formState.age),
      heightCm: Number(formState.heightCm),
      weightKg: Number(formState.weightKg),
      activityLevel: formState.activityLevel,
      goal: formState.goal,
    })

    const payload: Partial<NutritionSettings> = {
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

    const normalizedCurrent = clampWeightKg(currentWeight)
    const normalizedTarget = clampWeightKg(parsedTarget)
    const weightGoalType = inferWeightGoalType(normalizedCurrent, normalizedTarget)
    const previousCalories =
      nutritionSettings?.daily_calorie_target ?? Number(formState.dailyCalories)

    try {
      const savedSettings = await saveWizardData()

      if (mode === 'edit' && existingGoal) {
        const reinstitute = isWeightGoalReinstitution(
          existingGoal,
          normalizedTarget,
        )
        const weightChanged =
          normalizedCurrent !== clampWeightKg(existingGoal.current_weight_kg)

        if (reinstitute) {
          const institution = institutionWeightSnapshot(
            normalizedCurrent,
            normalizedTarget,
          )

          await updateGoal.mutateAsync({
            ...institution,
            created_at: new Date().toISOString(),
          })

          await insertWeightEntry.mutateAsync({
            weight_kg: institution.current_weight_kg,
            source: 'goal_start',
          })
        } else {
          const nextGoalType = inferWeightGoalType(
            existingGoal.start_weight_kg,
            normalizedTarget,
          )

          await updateGoal.mutateAsync({
            target_weight_kg: normalizedTarget,
            goal_type: nextGoalType,
            ...(weightChanged ? { current_weight_kg: normalizedCurrent } : {}),
          })

          if (weightChanged) {
            await insertWeightEntry.mutateAsync({
              weight_kg: normalizedCurrent,
              source: 'adjust',
            })
          }
        }
      } else {
        const institution = institutionWeightSnapshot(
          normalizedCurrent,
          normalizedTarget,
        )

        await upsertGoal.mutateAsync(institution)

        await insertWeightEntry.mutateAsync({
          weight_kg: institution.current_weight_kg,
          source: 'goal_start',
        })
      }

      const suggestion = suggestCalorieTarget(
        savedSettings,
        weightGoalType,
        currentWeight,
        {
          sex: formState.sex,
          age: Number(formState.age),
          height_cm: Number(formState.heightCm),
          waist_cm: userMeasurements?.waist_cm ?? null,
        },
      )

      const fallbackTdee = calculateTdee({
        sex: formState.sex,
        age: Number(formState.age),
        heightCm: Number(formState.heightCm),
        weightKg: currentWeight,
        activityLevel: formState.activityLevel,
        goal: weightGoalType,
      })

      const effectiveSuggestion = suggestion ?? {
        suggestedCalories: fallbackTdee.dailyTarget,
        tdee: fallbackTdee.tdee,
        currentCalories: previousCalories,
        delta: fallbackTdee.dailyTarget - previousCalories,
      }

      if (!shouldSuggestCalorieUpdate(effectiveSuggestion)) {
        onOpenChange(false)
        onCompleted?.()
        return
      }

      setPendingCalorieSuggestion({
        suggestedCalories: effectiveSuggestion.suggestedCalories,
        tdee: effectiveSuggestion.tdee,
        goalType: weightGoalType,
        previousCalories,
      })
      calorieActionTakenRef.current = false
      onOpenChange(false)
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
    if (calorieActionTakenRef.current) {
      return
    }

    calorieActionTakenRef.current = true

    if (!pendingCalorieSuggestion) {
      setCalorieDialogOpen(false)
      onCompleted?.()
      return
    }

    if (accept) {
      try {
        await upsertNutrition.mutateAsync({
          goal: pendingCalorieSuggestion.goalType,
          daily_calorie_target: pendingCalorieSuggestion.suggestedCalories,
          tdee_calculated: pendingCalorieSuggestion.tdee,
          onboarded_at: nutritionSettings?.onboarded_at ?? new Date().toISOString(),
        })
      } catch (saveError) {
        calorieActionTakenRef.current = false
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
    onCompleted?.()
  }

  const isSaving =
    upsertNutrition.isPending ||
    upsertUserMeasurements.isPending ||
    upsertGoal.isPending ||
    updateGoal.isPending ||
    insertWeightEntry.isPending

  return (
    <>
      <Dialog open={open && !calorieDialogOpen} onOpenChange={onOpenChange}>
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
            if (!nextOpen && !calorieActionTakenRef.current) {
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
