import { useQuery } from '@tanstack/react-query'

import { fetchNutritionDayEntries, nutritionDayQueryKey } from '@/lib/nutrition/fetch-nutrition-day-entries'
import { getMealCalorieTarget } from '@/lib/nutrition/meal-targets'
import { sumNutrients } from '@/lib/nutrition/nutrient-math'
import type { MealLogEntry, MealType, NutritionSettings } from '@/lib/nutrition/types'
import { MEAL_TYPES } from '@/lib/nutrition/types'
import { macroGramsFromPercentages } from '@/lib/nutrition/tdee'
import { useAuth } from '@/lib/nhost/AuthProvider'

export type MealDaySummary = {
  mealType: MealType
  entries: MealLogEntry[]
  totals: {
    calories: number
    carbsG: number
    proteinG: number
    fatG: number
  }
  targetCalories: number
}

export type NutritionDaySummary = {
  date: string
  entries: MealLogEntry[]
  meals: MealDaySummary[]
  totals: {
    calories: number
    carbsG: number
    proteinG: number
    fatG: number
  }
  targets: {
    calories: number
    carbsG: number
    proteinG: number
    fatG: number
  }
  remainingCalories: number
}

function buildDaySummary(
  date: string,
  entries: MealLogEntry[],
  settings: NutritionSettings,
): NutritionDaySummary {
  const macroTargets = macroGramsFromPercentages(
    settings.daily_calorie_target,
    Number(settings.carbs_pct),
    Number(settings.protein_pct),
    Number(settings.fat_pct),
  )

  const meals = MEAL_TYPES.map((mealType) => {
    const mealEntries = entries.filter((entry) => entry.meal_type === mealType)
    const totals = sumNutrients(
      mealEntries.map((entry) => ({
        calories: Number(entry.calories),
        carbsG: Number(entry.carbs_g),
        proteinG: Number(entry.protein_g),
        fatG: Number(entry.fat_g),
      })),
    )

    return {
      mealType,
      entries: mealEntries,
      totals,
      targetCalories: getMealCalorieTarget(settings, mealType),
    }
  })

  const totals = sumNutrients(meals.map((meal) => meal.totals))

  return {
    date,
    entries,
    meals,
    totals,
    targets: {
      calories: settings.daily_calorie_target,
      carbsG: macroTargets.carbsG,
      proteinG: macroTargets.proteinG,
      fatG: macroTargets.fatG,
    },
    remainingCalories: settings.daily_calorie_target - totals.calories,
  }
}

export function useNutritionDay(date: string, settings: NutritionSettings | null | undefined) {
  const { nhost, isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: nutritionDayQueryKey(user?.id, date),
    enabled: isAuthenticated && Boolean(settings) && Boolean(user?.id),
    staleTime: 60_000,
    placeholderData: undefined,
    queryFn: async () => {
      const entries = await fetchNutritionDayEntries(nhost, user!.id, date)
      return buildDaySummary(date, entries, settings!)
    },
  })
}

export function buildNutritionDaySummary(
  date: string,
  entries: MealLogEntry[],
  settings: NutritionSettings,
) {
  return buildDaySummary(date, entries, settings)
}
