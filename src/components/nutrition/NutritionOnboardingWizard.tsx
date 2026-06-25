import { useEffect, useState } from 'react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useUpsertNutritionSettings } from '@/hooks/useNutritionSettings'
import { calculateTdee } from '@/lib/nutrition/tdee'
import type {
  ActivityLevel,
  NutritionGoal,
  NutritionSex,
  NutritionSettings,
} from '@/lib/nutrition/types'

type NutritionOnboardingWizardProps = {
  open: boolean
  onCompleted: () => void
}

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

export function NutritionOnboardingWizard({
  open,
  onCompleted,
}: NutritionOnboardingWizardProps) {
  const upsert = useUpsertNutritionSettings()
  const [step, setStep] = useState(0)
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const tdee = calculateTdee({
      sex,
      age: Number(age) || 30,
      heightCm: Number(heightCm) || 175,
      weightKg: Number(weightKg) || 75,
      activityLevel,
      goal,
      calorieAdjustment: Number(calorieAdjustment) || 0,
    })

    setDailyCalories(String(tdee.dailyTarget))
  }, [open, sex, age, heightCm, weightKg, activityLevel, goal, calorieAdjustment])

  async function handleFinish() {
    setError(null)

    const macroTotal = carbsPct + proteinPct + fatPct
    const mealTotal = breakfastPct + lunchPct + snackPct + dinnerPct

    if (macroTotal !== 100) {
      setError('Les macros doivent totaliser 100 %.')
      return
    }

    if (mealTotal !== 100) {
      setError('La repartition des repas doit totaliser 100 %.')
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

    const payload: Partial<NutritionSettings> = {
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
      onboarded_at: new Date().toISOString(),
    }

    try {
      await upsert.mutateAsync(payload)
      onCompleted()
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : 'Impossible de sauvegarder les objectifs.',
      )
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurer votre nutrition</DialogTitle>
          <DialogDescription>
            Etape {step + 1} sur 3 — definissez vos objectifs journaliers.
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          <div className="space-y-4">
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
              <div className="space-y-2">
                <Label>Age</Label>
                <Input value={age} onChange={(event) => setAge(event.target.value)} inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <Label>Taille (cm)</Label>
                <Input value={heightCm} onChange={(event) => setHeightCm(event.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Poids (kg)</Label>
                <Input value={weightKg} onChange={(event) => setWeightKg(event.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Ajustement kcal</Label>
                <Input
                  value={calorieAdjustment}
                  onChange={(event) => setCalorieAdjustment(event.target.value)}
                  inputMode="numeric"
                />
              </div>
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
            <div className="space-y-2">
              <Label>Objectif calorique journalier</Label>
              <Input value={dailyCalories} onChange={(event) => setDailyCalories(event.target.value)} inputMode="numeric" />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <MacroSlider label="Glucides" value={carbsPct} onChange={setCarbsPct} />
            <MacroSlider label="Proteines" value={proteinPct} onChange={setProteinPct} />
            <MacroSlider label="Lipides" value={fatPct} onChange={setFatPct} />
            <p className="text-sm text-muted-foreground">Total : {carbsPct + proteinPct + fatPct}%</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <MacroSlider label="Petit dejeuner" value={breakfastPct} onChange={setBreakfastPct} />
            <MacroSlider label="Repas" value={lunchPct} onChange={setLunchPct} />
            <MacroSlider label="Gouter" value={snackPct} onChange={setSnackPct} />
            <MacroSlider label="Diner" value={dinnerPct} onChange={setDinnerPct} />
            <p className="text-sm text-muted-foreground">
              Total : {breakfastPct + lunchPct + snackPct + dinnerPct}%
            </p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
            Retour
          </Button>
          {step < 2 ? (
            <Button type="button" onClick={() => setStep((value) => value + 1)}>
              Continuer
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleFinish()} disabled={upsert.isPending}>
              Terminer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MacroSlider({
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
