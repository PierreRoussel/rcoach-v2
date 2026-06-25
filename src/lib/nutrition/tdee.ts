import type { ActivityLevel, NutritionGoal, NutritionSex } from '@/lib/nutrition/types'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const GOAL_ADJUSTMENTS: Record<NutritionGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
}

export type TdeeInput = {
  sex: NutritionSex
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: NutritionGoal
  calorieAdjustment?: number
}

export function calculateBmr(input: Pick<TdeeInput, 'sex' | 'age' | 'heightCm' | 'weightKg'>) {
  const { sex, age, heightCm, weightKg } = input

  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  }

  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

export function calculateTdee(input: TdeeInput) {
  const bmr = calculateBmr(input)
  const activityMultiplier = ACTIVITY_MULTIPLIERS[input.activityLevel]
  const tdee = Math.round(bmr * activityMultiplier)
  const goalAdjustment = GOAL_ADJUSTMENTS[input.goal]
  const manualAdjustment = input.calorieAdjustment ?? 0

  return {
    bmr: Math.round(bmr),
    tdee,
    dailyTarget: Math.max(1200, tdee + goalAdjustment + manualAdjustment),
  }
}

export function macroGramsFromPercentages(
  dailyCalories: number,
  carbsPct: number,
  proteinPct: number,
  fatPct: number,
) {
  return {
    carbsG: Math.round((dailyCalories * (carbsPct / 100)) / 4),
    proteinG: Math.round((dailyCalories * (proteinPct / 100)) / 4),
    fatG: Math.round((dailyCalories * (fatPct / 100)) / 9),
  }
}
