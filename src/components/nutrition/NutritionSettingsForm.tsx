import { useEffect, useState } from 'react'

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
import { useNutritionSettings, useUpsertNutritionSettings } from '@/hooks/useNutritionSettings'
import { adjustLinkedPercentages } from '@/lib/nutrition/linked-percentages'
import { calculateTdee } from '@/lib/nutrition/tdee'
import type { ActivityLevel, NutritionGoal, NutritionSex } from '@/lib/nutrition/types'

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentaire',
  light: 'Leger',
  moderate: 'Modere',
  active: 'Actif',
  very_active: 'Tres actif',
}

const GOAL_LABELS: Record<NutritionGoal, string> = {
  lose: 'Perte de poids',
  maintain: 'Maintien',
  gain: 'Prise de masse',
}

export function NutritionSettingsForm() {
  const { data: settings, isLoading } = useNutritionSettings()
  const upsert = useUpsertNutritionSettings()
  const [message, setMessage] = useState<string | null>(null)

  const [sex, setSex] = useState<NutritionSex>('male')
  const [age, setAge] = useState('30')
  const [heightCm, setHeightCm] = useState('175')
  const [weightKg, setWeightKg] = useState('75')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<NutritionGoal>('maintain')
  const [dailyCalories, setDailyCalories] = useState('2200')
  const [macroDistribution, setMacroDistribution] = useState(DEFAULT_MACRO_DISTRIBUTION)
  const [mealDistribution, setMealDistribution] = useState(DEFAULT_MEAL_DISTRIBUTION)

  useEffect(() => {
    if (!settings) {
      return
    }

    setSex(settings.sex ?? 'male')
    setAge(String(settings.age ?? 30))
    setHeightCm(String(settings.height_cm ?? 175))
    setWeightKg(String(settings.weight_kg ?? 75))
    setActivityLevel(settings.activity_level ?? 'moderate')
    setGoal(settings.goal ?? 'maintain')
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
    const tdee = calculateTdee({
      sex,
      age: Number(age) || 30,
      heightCm: Number(heightCm) || 175,
      weightKg: Number(weightKg) || 75,
      activityLevel,
      goal,
    })

    if (!settings) {
      setDailyCalories(String(tdee.dailyTarget))
    }
  }, [sex, age, heightCm, weightKg, activityLevel, goal, settings])

  async function handleSave() {
    setMessage(null)

    const tdee = calculateTdee({
      sex,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      goal,
    })

    try {
      await upsert.mutateAsync({
        sex,
        age: Number(age),
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        activity_level: activityLevel,
        goal,
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
      setMessage('Objectifs nutrition mis a jour.')
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Sauvegarde impossible.')
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des reglages...</p>
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
            <Field label="Age" value={age} onChange={setAge} />
            <Field label="Taille (cm)" value={heightCm} onChange={setHeightCm} />
            <Field label="Poids (kg)" value={weightKg} onChange={setWeightKg} />
          </div>
          <div className="space-y-2">
            <Label>Activite</Label>
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
          <div className="space-y-2">
            <Label>Objectif</Label>
            <Select value={goal} onValueChange={(value) => setGoal(value as NutritionGoal)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <CardTitle>Repartition des repas</CardTitle>
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

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Button type="button" className="w-full" onClick={() => void handleSave()} disabled={upsert.isPending}>
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
