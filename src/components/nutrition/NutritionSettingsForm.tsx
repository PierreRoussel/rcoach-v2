import { useEffect, useState } from 'react'

import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_MEAL_DISTRIBUTION,
  MealDistributionSliders,
  type MealDistributionKey,
} from '@/components/nutrition/MealDistributionSliders'
import {
  DEFAULT_MACRO_DISTRIBUTION,
  MacroDistributionSliders,
  type MacroDistributionKey,
} from '@/components/nutrition/MacroDistributionSliders'
import { useInsertWeightEntry } from '@/hooks/useWeightEntries'
import { useNutritionSettings, useUpsertNutritionSettings } from '@/hooks/useNutritionSettings'
import {
  useCurrentWeightKg,
  useResolvedWeightGoal,
} from '@/hooks/useWeightGoal'
import {
  useResolvedUserMeasurements,
  useUpsertUserMeasurements,
} from '@/hooks/useUserMeasurements'
import { adjustLinkedPercentages } from '@/lib/nutrition/linked-percentages'
import { calculateTdee } from '@/lib/nutrition/tdee'
import type { ActivityLevel, NutritionSex } from '@/lib/nutrition/types'

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sédentaire',
  light: 'Léger',
  moderate: 'Modéré',
  active: 'Actif',
  very_active: 'Très actif',
}

export function NutritionSettingsForm() {
  const { data: settings, isLoading } = useNutritionSettings()
  const { data: measurements, isLoading: measurementsLoading } = useResolvedUserMeasurements()
  const { data: weightGoal } = useResolvedWeightGoal()
  const storedWeightKg = useCurrentWeightKg()
  const upsert = useUpsertNutritionSettings()
  const upsertMeasurements = useUpsertUserMeasurements()
  const insertWeightEntry = useInsertWeightEntry()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [sex, setSex] = useState<NutritionSex>('male')
  const [age, setAge] = useState('30')
  const [heightCm, setHeightCm] = useState('175')
  const [weightKg, setWeightKg] = useState('75')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [dailyCalories, setDailyCalories] = useState('2200')
  const [macroDistribution, setMacroDistribution] = useState(DEFAULT_MACRO_DISTRIBUTION)
  const [mealDistribution, setMealDistribution] = useState(DEFAULT_MEAL_DISTRIBUTION)

  const tdeeGoal = weightGoal?.goal_type ?? 'maintain'

  useEffect(() => {
    if (!settings) {
      return
    }

    setActivityLevel(settings.activity_level ?? 'moderate')
    setDailyCalories(String(settings.daily_calorie_target))
    setMacroDistribution({
      carbs: Number(settings.carbs_pct),
      protein: Number(settings.protein_pct),
      fat: Number(settings.fat_pct),
    })
    setMealDistribution({
      breakfast: Number(settings.breakfast_pct),
      lunch: Number(settings.lunch_pct),
      snack: Number(settings.snack_pct),
      dinner: Number(settings.dinner_pct),
    })
  }, [settings])

  useEffect(() => {
    if (storedWeightKg != null) {
      setWeightKg(String(storedWeightKg))
    }
  }, [storedWeightKg])

  useEffect(() => {
    if (!measurements) {
      return
    }

    setSex(measurements.sex ?? 'male')
    setAge(String(measurements.age ?? 30))
    setHeightCm(String(measurements.height_cm ?? 175))
  }, [measurements])

  useEffect(() => {
    const tdee = calculateTdee({
      sex,
      age: Number(age) || 30,
      heightCm: Number(heightCm) || 175,
      weightKg: Number(weightKg) || 75,
      activityLevel,
      goal: tdeeGoal,
    })

    if (!settings) {
      setDailyCalories(String(tdee.dailyTarget))
    }
  }, [sex, age, heightCm, weightKg, activityLevel, tdeeGoal, settings])

  async function handleSave() {
    setSuccessMessage(null)
    setError(null)

    const parsedWeight = Number(weightKg)
    const tdee = calculateTdee({
      sex,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: parsedWeight,
      activityLevel,
      goal: tdeeGoal,
    })

    try {
      await upsertMeasurements.mutateAsync({
        sex,
        age: Number(age),
        height_cm: Number(heightCm),
      })

      await upsert.mutateAsync({
        activity_level: activityLevel,
        calorie_adjustment: settings?.calorie_adjustment ?? 0,
        tdee_calculated: tdee.tdee,
        daily_calorie_target: Number(dailyCalories),
        carbs_pct: macroDistribution.carbs,
        protein_pct: macroDistribution.protein,
        fat_pct: macroDistribution.fat,
        breakfast_pct: mealDistribution.breakfast,
        lunch_pct: mealDistribution.lunch,
        snack_pct: mealDistribution.snack,
        dinner_pct: mealDistribution.dinner,
        onboarded_at: settings?.onboarded_at ?? new Date().toISOString(),
      })

      if (
        Number.isFinite(parsedWeight) &&
        parsedWeight > 0 &&
        parsedWeight !== storedWeightKg
      ) {
        await insertWeightEntry.mutateAsync({
          weight_kg: parsedWeight,
          source: 'manual',
        })
      }

      setSuccessMessage('Objectifs nutrition mis à jour.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Sauvegarde impossible.')
    }
  }

  if (isLoading || measurementsLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des réglages...</p>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calculateur TDEE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sexe</Label>
            <Select value={sex} onValueChange={(value) => setSex(value as NutritionSex)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Homme</SelectItem>
                <SelectItem value="female">Femme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Âge" value={age} onChange={setAge} />
            <Field label="Taille (cm)" value={heightCm} onChange={setHeightCm} />
            <Field label="Poids (kg)" value={weightKg} onChange={setWeightKg} />
          </div>
          <div className="space-y-2">
            <Label>Activité</Label>
            <Select
              value={activityLevel}
              onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {weightGoal ? (
            <p className="text-sm text-muted-foreground">
              Objectif poids :{' '}
              <span className="font-medium text-foreground">
                {weightGoal.goal_type === 'lose'
                  ? 'Perte de poids'
                  : weightGoal.goal_type === 'gain'
                    ? 'Prise de masse'
                    : 'Maintien'}
              </span>{' '}
              (défini dans Objectifs)
            </p>
          ) : null}
          <Field label="Objectif calorique journalier" value={dailyCalories} onChange={setDailyCalories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Macros (% des kcal)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MacroDistributionSliders
            values={macroDistribution}
            dailyCalories={Number(dailyCalories) || 0}
            onChange={(key, value) => {
              setMacroDistribution((current) =>
                adjustLinkedPercentages(current, key as MacroDistributionKey, value),
              )
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition des repas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MealDistributionSliders
            values={mealDistribution}
            dailyCalories={Number(dailyCalories) || 0}
            onChange={(key, value) => {
              setMealDistribution((current) =>
                adjustLinkedPercentages(current, key as MealDistributionKey, value),
              )
            }}
          />
        </CardContent>
      </Card>

      {successMessage ? (
        <FeedbackMessage variant="success">{successMessage}</FeedbackMessage>
      ) : null}
      {error ? <FeedbackMessage variant="error">{error}</FeedbackMessage> : null}

      <Button
        type="button"
        className="w-full"
        onClick={() => void handleSave()}
        disabled={
          upsert.isPending || upsertMeasurements.isPending || insertWeightEntry.isPending
        }
      >
        Enregistrer
      </Button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" />
    </div>
  )
}
