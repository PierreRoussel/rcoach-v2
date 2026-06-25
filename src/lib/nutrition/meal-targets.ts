import type { MealType, NutritionSettings } from '@/lib/nutrition/types'
import { MEAL_TYPES } from '@/lib/nutrition/types'

export type MealCalorieTarget = {
  mealType: MealType
  targetCalories: number
}

export function getMealPercent(settings: NutritionSettings, mealType: MealType) {
  switch (mealType) {
    case 'breakfast':
      return Number(settings.breakfast_pct)
    case 'lunch':
      return Number(settings.lunch_pct)
    case 'snack':
      return Number(settings.snack_pct)
    case 'dinner':
      return Number(settings.dinner_pct)
  }
}

export function getMealCalorieTargets(settings: NutritionSettings): MealCalorieTarget[] {
  const daily = settings.daily_calorie_target

  return MEAL_TYPES.map((mealType) => ({
    mealType,
    targetCalories: Math.round(daily * (getMealPercent(settings, mealType) / 100)),
  }))
}

export function getMealCalorieTarget(settings: NutritionSettings, mealType: MealType) {
  return getMealCalorieTargets(settings).find((item) => item.mealType === mealType)?.targetCalories ?? 0
}
