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
import { Slider } from '@/components/ui/slider'
import { useNutritionSettings, useUpsertNutritionSettings } from '@/hooks/useNutritionSettings'
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
  const [calorieAdjustment, setCalorieAdjustment] = useState('0')
  const [dailyCalories, setDailyCalories] = useState('2200')
  const [carbsPct, setCarbsPct] = useState(40)
  const [proteinPct, setProteinPct] = useState(30)
  const [fatPct, setFatPct] = useState(30)
  const [breakfastPct, setBreakfastPct] = useState(20)
  const [lunchPct, setLunchPct] = useState(35)
  const [snackPct, setSnackPct] = useState(10)
  const [dinnerPct, setDinnerPct] = useState(35)

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
    setCalorieAdjustment(String(settings.calorie_adjustment ?? 0))
    setDailyCalories(String(settings.daily_calorie_target))
    setCarbsPct(Number(settings.carbs_pct))
    setProteinPct(Number(settings.protein_pct))
    setFatPct(Number(settings.fat_pct))
    setBreakfastPct(Number(settings.breakfast_pct))
    setLunchPct(Number(settings.lunch_pct))
    setSnackPct(Number(settings.snack_pct))
    setDinnerPct(Number(settings.dinner_pct))
  }, [settings])

  useEffect(() => {
    const tdee = calculateTdee({
      sex,
      age: Number(age) || 30,
      heightCm: Number(heightCm) || 175,
      weightKg: Number(weightKg) || 75,
      activityLevel,
      goal,
      calorieAdjustment: Number(calorieAdjustment) || 0,
    })

    if (!settings) {
      setDailyCalories(String(tdee.dailyTarget))
    }
  }, [sex, age, heightCm, weightKg, activityLevel, goal, calorieAdjustment, settings])

  async function handleSave() {
    setMessage(null)

    const macroTotal = carbsPct + proteinPct + fatPct
    const mealTotal = breakfastPct + lunchPct + snackPct + dinnerPct

    if (macroTotal !== 100 || mealTotal !== 100) {
      setMessage('Les pourcentages doivent totaliser 100 %.')
      return
    }

    const tdee = calculateTdee({
      sex,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel,
      goal,
      calorieAdjustment: Number(calorieAdjustment) || 0,
    })

    try {
      await upsert.mutateAsync({
        sex,
        age: Number(age),
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        activity_level: activityLevel,
        goal,
        calorie_adjustment: Number(calorieAdjustment) || 0,
        tdee_calculated: tdee.tdee,
        daily_calorie_target: Number(dailyCalories),
        carbs_pct: carbsPct,
        protein_pct: proteinPct,
        fat_pct: fatPct,
        breakfast_pct: breakfastPct,
        lunch_pct: lunchPct,
        snack_pct: snackPct,
        dinner_pct: dinnerPct,
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
            <Field label="Ajustement kcal" value={calorieAdjustment} onChange={setCalorieAdjustment} />
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
          <PctSlider label="Glucides" value={carbsPct} onChange={setCarbsPct} />
          <PctSlider label="Proteines" value={proteinPct} onChange={setProteinPct} />
          <PctSlider label="Lipides" value={fatPct} onChange={setFatPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repartition des repas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PctSlider label="Petit dejeuner" value={breakfastPct} onChange={setBreakfastPct} />
          <PctSlider label="Repas" value={lunchPct} onChange={setLunchPct} />
          <PctSlider label="Gouter" value={snackPct} onChange={setSnackPct} />
          <PctSlider label="Diner" value={dinnerPct} onChange={setDinnerPct} />
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

function PctSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span>{value}%</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={1} onValueChange={(next) => onChange(next[0] ?? 0)} />
    </div>
  )
}
