import { isQuickMealEntry, mealEntryToPortionInput } from '@/lib/nutrition/meal-entry-display'
import { getHintWindowDates } from '@/lib/nutrition/fetch-nutrition-day-entries'
import {
  scaleExtendedNutrients,
  sumExtendedNutrients,
  type ExtendedNutrientTotals,
} from '@/lib/nutrition/nutrient-math'
import { macroGramsFromPercentages } from '@/lib/nutrition/tdee'
import type { MealLogEntry, MealType, NutritionSettings } from '@/lib/nutrition/types'
import { MEAL_TYPES } from '@/lib/nutrition/types'

/** No fiber field in DB — fiber-based hints are out of scope. */

export type DayHintSnapshot = {
  date: string
  entryCount: number
  quickEntryCount: number
  mealsWithEntries: MealType[]
  mealsMissing: MealType[]
  totals: ExtendedNutrientTotals
  mealCalories: Record<MealType, number>
}

export type NutritionHintMetrics = {
  anchorDate: string
  windowDates: string[]
  daysLogged: number
  totalEntries: number
  quickEntryCount: number
  quickEntryRatio: number
  insufficientData: boolean
  hasSaltData: boolean
  hasSugarData: boolean
  hasSaturatedFatData: boolean
  weightKg: number | null
  dailyCalorieTarget: number
  macroTargets: {
    carbsG: number
    proteinG: number
    fatG: number
  }
  proteinGramsPerKgTarget: { min: number; max: number } | null
  avgDaily: ExtendedNutrientTotals
  /** Jour affiché s'il est journalisé, sinon moyenne des jours loggés. */
  primaryDaily: ExtendedNutrientTotals
  sumWindow: ExtendedNutrientTotals
  avgVsTarget: {
    caloriesPct: number
    carbsPct: number
    proteinPct: number
    fatPct: number
  }
  primaryVsTarget: {
    caloriesPct: number
    carbsPct: number
    proteinPct: number
    fatPct: number
  }
  proteinPerKcal: number
  carbsPerKcal: number
  sugarEnergyPct: number | null
  saturatedFatEnergyPct: number | null
  daysWithoutBreakfast: number
  daysSnackHeavy: number
  daysDinnerHeavy: number
  days: DayHintSnapshot[]
}

const SNACK_HEAVY_RATIO = 0.28
const DINNER_HEAVY_RATIO = 0.42

function entryToExtendedTotals(entry: MealLogEntry): ExtendedNutrientTotals {
  const base = {
    calories: Number(entry.calories),
    carbsG: Number(entry.carbs_g),
    proteinG: Number(entry.protein_g),
    fatG: Number(entry.fat_g),
  }

  if (!entry.food) {
    return { ...base, saltG: null, sugarG: null, saturatedFatG: null }
  }

  const portion = mealEntryToPortionInput(entry)
  if (!portion) {
    return { ...base, saltG: null, sugarG: null, saturatedFatG: null }
  }

  const extended = scaleExtendedNutrients(entry.food, portion)

  return {
    ...base,
    saltG: extended.saltG,
    sugarG: extended.sugarG,
    saturatedFatG: extended.saturatedFatG,
  }
}

function buildDaySnapshot(date: string, entries: MealLogEntry[]): DayHintSnapshot {
  const mealCalories = Object.fromEntries(MEAL_TYPES.map((meal) => [meal, 0])) as Record<
    MealType,
    number
  >

  for (const entry of entries) {
    mealCalories[entry.meal_type] += Number(entry.calories)
  }

  const mealsWithEntries = MEAL_TYPES.filter((meal) => mealCalories[meal] > 0)
  const mealsMissing = MEAL_TYPES.filter((meal) => mealCalories[meal] === 0)

  return {
    date,
    entryCount: entries.length,
    quickEntryCount: entries.filter((entry) => isQuickMealEntry(entry)).length,
    mealsWithEntries,
    mealsMissing,
    totals: sumExtendedNutrients(entries.map(entryToExtendedTotals)),
    mealCalories,
  }
}

function averageExtendedTotals(days: DayHintSnapshot[]): ExtendedNutrientTotals {
  if (days.length === 0) {
    return {
      calories: 0,
      carbsG: 0,
      proteinG: 0,
      fatG: 0,
      saltG: null,
      sugarG: null,
      saturatedFatG: null,
    }
  }

  const loggedDays = days.filter((day) => day.entryCount > 0)
  const divisor = Math.max(loggedDays.length, 1)

  const sum = sumExtendedNutrients(loggedDays.map((day) => day.totals))

  const avgSalt =
    sum.saltG != null ? Math.round((sum.saltG / divisor) * 10) / 10 : null
  const avgSugar =
    sum.sugarG != null ? Math.round((sum.sugarG / divisor) * 10) / 10 : null
  const avgSatFat =
    sum.saturatedFatG != null
      ? Math.round((sum.saturatedFatG / divisor) * 10) / 10
      : null

  return {
    calories: Math.round(sum.calories / divisor),
    carbsG: Math.round((sum.carbsG / divisor) * 10) / 10,
    proteinG: Math.round((sum.proteinG / divisor) * 10) / 10,
    fatG: Math.round((sum.fatG / divisor) * 10) / 10,
    saltG: avgSalt,
    sugarG: avgSugar,
    saturatedFatG: avgSatFat,
  }
}

function nutrientEnergyPct(grams: number | null, kcalPerGram: number, totalKcal: number) {
  if (grams == null || totalKcal <= 0) {
    return null
  }

  return (grams * kcalPerGram) / totalKcal
}

function pctOfTarget(actual: number, target: number) {
  if (target <= 0) {
    return 0
  }

  return actual / target
}

export function buildNutritionHintMetrics(
  anchorDate: string,
  entriesByDate: Map<string, MealLogEntry[]>,
  settings: NutritionSettings,
  weightKg?: number | null,
): NutritionHintMetrics {
  const windowDates = getHintWindowDates(anchorDate)
  const days = windowDates.map((date) =>
    buildDaySnapshot(date, entriesByDate.get(date) ?? []),
  )

  const daysLogged = days.filter((day) => day.entryCount > 0).length
  const totalEntries = days.reduce((acc, day) => acc + day.entryCount, 0)
  const quickEntryCount = days.reduce((acc, day) => acc + day.quickEntryCount, 0)
  const quickEntryRatio = totalEntries > 0 ? quickEntryCount / totalEntries : 0

  const macroTargets = macroGramsFromPercentages(
    settings.daily_calorie_target,
    Number(settings.carbs_pct),
    Number(settings.protein_pct),
    Number(settings.fat_pct),
  )

  const resolvedWeightKg =
    weightKg != null && Number.isFinite(weightKg) ? Number(weightKg) : null
  const proteinGramsPerKgTarget = resolvedWeightKg
    ? { min: 1.6 * resolvedWeightKg, max: 2.2 * resolvedWeightKg }
    : null

  const avgDaily = averageExtendedTotals(days)
  const anchorDay = days.find((day) => day.date === anchorDate)
  const primaryDaily =
    anchorDay != null && anchorDay.entryCount > 0 ? anchorDay.totals : avgDaily
  const sumWindow = sumExtendedNutrients(days.map((day) => day.totals))

  const avgVsTarget = {
    caloriesPct: pctOfTarget(avgDaily.calories, settings.daily_calorie_target),
    carbsPct: pctOfTarget(avgDaily.carbsG, macroTargets.carbsG),
    proteinPct: pctOfTarget(avgDaily.proteinG, macroTargets.proteinG),
    fatPct: pctOfTarget(avgDaily.fatG, macroTargets.fatG),
  }

  const primaryVsTarget = {
    caloriesPct: pctOfTarget(primaryDaily.calories, settings.daily_calorie_target),
    carbsPct: pctOfTarget(primaryDaily.carbsG, macroTargets.carbsG),
    proteinPct: pctOfTarget(primaryDaily.proteinG, macroTargets.proteinG),
    fatPct: pctOfTarget(primaryDaily.fatG, macroTargets.fatG),
  }

  const proteinPerKcal = primaryDaily.calories > 0 ? primaryDaily.proteinG / primaryDaily.calories : 0
  const carbsPerKcal = primaryDaily.calories > 0 ? primaryDaily.carbsG / primaryDaily.calories : 0

  const daysWithoutBreakfast = days.filter(
    (day) => day.entryCount > 0 && day.mealCalories.breakfast === 0,
  ).length

  const daysSnackHeavy = days.filter((day) => {
    if (day.totals.calories <= 0) {
      return false
    }

    return day.mealCalories.snack / day.totals.calories >= SNACK_HEAVY_RATIO
  }).length

  const daysDinnerHeavy = days.filter((day) => {
    if (day.totals.calories <= 0) {
      return false
    }

    return day.mealCalories.dinner / day.totals.calories >= DINNER_HEAVY_RATIO
  }).length

  return {
    anchorDate,
    windowDates,
    daysLogged,
    totalEntries,
    quickEntryCount,
    quickEntryRatio,
    insufficientData: totalEntries < 3 || daysLogged < 2,
    hasSaltData: sumWindow.saltG != null,
    hasSugarData: sumWindow.sugarG != null,
    hasSaturatedFatData: sumWindow.saturatedFatG != null,
    weightKg,
    dailyCalorieTarget: settings.daily_calorie_target,
    macroTargets,
    proteinGramsPerKgTarget,
    avgDaily,
    primaryDaily,
    sumWindow,
    avgVsTarget,
    primaryVsTarget,
    proteinPerKcal,
    carbsPerKcal,
    sugarEnergyPct: nutrientEnergyPct(primaryDaily.sugarG, 4, primaryDaily.calories),
    saturatedFatEnergyPct: nutrientEnergyPct(primaryDaily.saturatedFatG, 9, primaryDaily.calories),
    daysWithoutBreakfast,
    daysSnackHeavy,
    daysDinnerHeavy,
    days,
  }
}

export function countCachedWindowEntries(
  windowDates: string[],
  getEntriesForDate: (date: string) => MealLogEntry[] | undefined,
) {
  return windowDates.reduce((acc, date) => acc + (getEntriesForDate(date)?.length ?? 0), 0)
}
