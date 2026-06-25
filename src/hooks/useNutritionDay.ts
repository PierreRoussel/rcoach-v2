import { useQuery } from '@tanstack/react-query'

import { LIST_MEAL_LOG_ENTRIES_FOR_DATE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { db, type NutritionDayCache } from '@/lib/db/dexie'
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
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['nutrition-day', date],
    enabled: isAuthenticated && Boolean(settings),
    queryFn: async () => {
      let entries: MealLogEntry[] = []

      try {
        const data = await graphqlRequest<{
          meal_log_entries: MealLogEntry[]
        }>(nhost, LIST_MEAL_LOG_ENTRIES_FOR_DATE, { date })
        entries = data.meal_log_entries
      } catch {
        const cached = await db.nutritionDayCache.get(date)
        if (cached) {
          entries = cached.entries as unknown as MealLogEntry[]
        }
      }

      const cached = await db.nutritionDayCache.get(date)
      if (cached?.entries.length) {
        const knownIds = new Set(entries.map((entry) => entry.id))
        for (const pendingEntry of cached.entries) {
          if (!pendingEntry.pending || knownIds.has(pendingEntry.id)) {
            continue
          }

          entries = [...entries, pendingEntry as unknown as MealLogEntry]
        }
      }

      await db.nutritionDayCache.put({
        date,
        entries: entries as unknown as NutritionDayCache['entries'],
        updatedAt: new Date().toISOString(),
      })

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
