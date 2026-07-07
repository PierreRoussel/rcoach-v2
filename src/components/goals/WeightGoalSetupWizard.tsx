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
  useCurrentWeightKg,
  useDeleteWeightGoal,
  useResolvedWeightGoal,
  useUpdateWeightGoal,
  useUpsertWeightGoal,
} from '@/hooks/useWeightGoal'
import {
  buildWeightGoalSetupCelebrationPayload,
  shouldShowWeightGoalSetupCelebration,
  type WeightGoalSetupCelebrationPayload,
  type WeightGoalSetupCompletedEvent,
} from '@/lib/goals/weight-goal-setup-celebration'
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
  onCompleted?: (result?: WeightGoalSetupCompletedEvent) => void
}

const STEP_LABELS = [
  'Objectif poids',
  'Données corporelles',
  'Macros',
  'Repas',
]

const EDIT_STEP_LABELS = [
  'Objectif poids',
  'Paramètres nutrition',
  'Macros',
  'Repas',
]

export function WeightGoalSetupWizard({
  open,
  onOpenChange,
  mode,
  onCompleted,
}: WeightGoalSetupWizardProps) {
  const { data: existingGoal } = useResolvedWeightGoal()
  const currentWeightKg = useCurrentWeightKg()
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: userMeasurements } = useUserMeasurements()
  const upsertNutrition = useUpsertNutritionSettings()
  const upsertUserMeasurements = useUpsertUserMeasurements()
  const upsertGoal = useUpsertWeightGoal()
  const updateGoal = useUpdateWeightGoal()
  const deleteGoal = useDeleteWeightGoal()
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
  const pendingCelebrationRef = useRef<WeightGoalSetupCelebrationPayload | null>(
    null,
  )

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
        sex: userMeasurements?.sex ?? 'male',
        age:
          userMeasurements?.age != null ? String(userMeasurements.age) : '30',
        heightCm:
          userMeasurements?.height_cm != null
            ? String(userMeasurements.height_cm)
            : '175',
        weightKg:
          existingGoal != null
            ? String(existingGoal.current_weight_kg)
            : currentWeightKg != null
              ? String(currentWeightKg)
              : '75',
        activityLevel: nutritionSettings?.activity_level ?? 'moderate',
        dailyCalories: String(nutritionSettings?.daily_calorie_target ?? 2200),
        macroDistribution: {
          carbs: nutritionSettings?.carbs_pct ?? 40,
          protein: nutritionSettings?.protein_pct ?? 30,
          fat: nutritionSettings?.fat_pct ?? 30,
        },
        mealDistribution: {
          breakfast: nutritionSettings?.breakfast_pct ?? 20,
          lunch: nutritionSettings?.lunch_pct ?? 35,
          snack: nutritionSettings?.snack_pct ?? 10,
          dinner: nutritionSettings?.dinner_pct ?? 35,
        },
      })
    } else {
      setFormState(createDefaultNutritionWizardState())
    }

    setTargetWeight(existingGoal ? String(existingGoal.target_weight_kg) : '')
  }, [open, mode, existingGoal, nutritionSettings, userMeasurements, currentWeightKg])

  const bodyMetrics = {
    sex: userMeasurements?.sex ?? formState.sex,
    age: userMeasurements?.age ?? (Number(formState.age) || 30),
    heightCm:
      userMeasurements?.height_cm ?? (Number(formState.heightCm) || 175),
    weightKg:
      mode === 'edit' && existingGoal
        ? existingGoal.current_weight_kg
        : Number(formState.weightKg) || 75,
  }

  const currentWeight = bodyMetrics.weightKg
  const parsedTarget = Number(targetWeight.replace(',', '.'))
  const inferredGoalType =
    Number.isFinite(currentWeight) && Number.isFinite(parsedTarget)
      ? inferWeightGoalType(currentWeight, parsedTarget)
      : null

  const tdeeGoalType =
    inferredGoalType ?? existingGoal?.goal_type ?? 'maintain'

  useEffect(() => {
    if (!open) {
      return
    }

    const sex = userMeasurements?.sex ?? formState.sex
    const age = userMeasurements?.age ?? (Number(formState.age) || 30)
    const heightCm =
      userMeasurements?.height_cm ?? (Number(formState.heightCm) || 175)
    const weightKg =
      mode === 'edit' && existingGoal
        ? existingGoal.current_weight_kg
        : Number(formState.weightKg) || 75

    const tdee = calculateTdee({
      sex,
      age,
      heightCm,
      weightKg,
      activityLevel: formState.activityLevel,
      goal: tdeeGoalType,
    })

    setFormState((current) => ({
      ...current,
      dailyCalories: String(tdee.dailyTarget),
    }))
  }, [
    open,
    mode,
    existingGoal,
    tdeeGoalType,
    userMeasurements?.sex,
    userMeasurements?.age,
    userMeasurements?.height_cm,
    formState.sex,
    formState.age,
    formState.heightCm,
    formState.weightKg,
    formState.activityLevel,
  ])

  const tdeePreview = calculateTdee({
    ...bodyMetrics,
    activityLevel: formState.activityLevel,
    goal: tdeeGoalType,
  })

  function emitCompleted(options?: {
    dailyCalorieTarget?: number
    tdee?: number
  }) {
    const base = pendingCelebrationRef.current
    pendingCelebrationRef.current = null

    if (!base) {
      onCompleted?.({ showCelebration: false })
      return
    }

    onCompleted?.({
      showCelebration: true,
      payload: {
        ...base,
        dailyCalorieTarget: options?.dailyCalorieTarget ?? base.dailyCalorieTarget,
        tdee: options?.tdee ?? base.tdee,
      },
    })
  }

  function handleNextStep() {
    if (step === 0) {
      const parsed = Number(targetWeight.replace(',', '.'))
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError('Indiquez un poids cible valide.')
        return
      }
      setError(null)
    }

    setStep((value) => value + 1)
  }

  async function saveWizardData(): Promise<NutritionSettings> {
    if (mode !== 'edit') {
      await upsertUserMeasurements.mutateAsync(
        buildWizardMeasurementsUpsert({
          sex: formState.sex,
          age: formState.age,
          heightCm: formState.heightCm,
        }),
      )
    }

    const sex = userMeasurements?.sex ?? formState.sex
    const age = userMeasurements?.age ?? Number(formState.age)
    const heightCm = userMeasurements?.height_cm ?? Number(formState.heightCm)
    const weightKg =
      mode === 'edit' && existingGoal
        ? existingGoal.current_weight_kg
        : Number(formState.weightKg)

    const tdee = calculateTdee({
      sex,
      age,
      heightCm,
      weightKg,
      activityLevel: formState.activityLevel,
      goal: tdeeGoalType,
    })

    const payload: Partial<NutritionSettings> = {
      activity_level: formState.activityLevel,
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

          await deleteGoal.mutateAsync()
          await upsertGoal.mutateAsync(institution)

          await insertWeightEntry.mutateAsync({
            weight_kg: normalizedCurrent,
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
          weight_kg: normalizedCurrent,
          source: 'goal_start',
        })
      }

      const suggestion = suggestCalorieTarget(
        savedSettings,
        weightGoalType,
        currentWeight,
        {
          sex: bodyMetrics.sex,
          age: bodyMetrics.age,
          height_cm: bodyMetrics.heightCm,
          waist_cm: userMeasurements?.waist_cm ?? null,
        },
      )

      const fallbackTdee = calculateTdee({
        ...bodyMetrics,
        activityLevel: formState.activityLevel,
        goal: weightGoalType,
      })

      const effectiveSuggestion = suggestion ?? {
        suggestedCalories: fallbackTdee.dailyTarget,
        tdee: fallbackTdee.tdee,
        currentCalories: previousCalories,
        delta: fallbackTdee.dailyTarget - previousCalories,
      }

      const shouldCelebrate = shouldShowWeightGoalSetupCelebration({
        mode,
        previousTargetKg: mode === 'edit' ? existingGoal?.target_weight_kg : null,
        nextTargetKg: normalizedTarget,
        goalType: weightGoalType,
      })

      pendingCelebrationRef.current = shouldCelebrate
        ? buildWeightGoalSetupCelebrationPayload({
            currentKg: normalizedCurrent,
            targetKg: normalizedTarget,
            dailyCalorieTarget: savedSettings.daily_calorie_target,
            tdee: effectiveSuggestion.tdee,
            userMeasurements: {
              sex: bodyMetrics.sex,
              age: bodyMetrics.age,
              height_cm: bodyMetrics.heightCm,
              waist_cm: userMeasurements?.waist_cm ?? null,
            },
          })
        : null

      if (!shouldSuggestCalorieUpdate(effectiveSuggestion)) {
        onOpenChange(false)
        emitCompleted({
          dailyCalorieTarget: savedSettings.daily_calorie_target,
          tdee: effectiveSuggestion.tdee,
        })
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
      emitCompleted()
      return
    }

    if (accept) {
      try {
        await upsertNutrition.mutateAsync({
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
    const suggestion = pendingCalorieSuggestion
    setPendingCalorieSuggestion(null)
    emitCompleted({
      dailyCalorieTarget: accept
        ? suggestion.suggestedCalories
        : suggestion.previousCalories,
      tdee: suggestion.tdee,
    })
  }

  const isSaving =
    upsertNutrition.isPending ||
    upsertUserMeasurements.isPending ||
    upsertGoal.isPending ||
    updateGoal.isPending ||
    deleteGoal.isPending ||
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
              Étape {step + 1} sur 4 —{' '}
              {(mode === 'edit' ? EDIT_STEP_LABELS : STEP_LABELS)[step]}
            </DialogDescription>
          </DialogHeader>

          {step === 0 ? (
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
            </div>
          ) : null}

          {step === 1 ? (
            <NutritionBodyStep
              state={formState}
              showBodyMetrics={mode !== 'edit'}
              onChange={(patch) =>
                setFormState((current) => ({ ...current, ...patch }))
              }
            />
          ) : null}

          {step === 2 ? (
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

          {step === 3 ? (
            <div className="space-y-4">
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
              <Button type="button" onClick={handleNextStep}>
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
