import type { Food } from '@/lib/nutrition/types'

export type NutrientTotals = {
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
}

export type PortionInput =
  | { mode: 'grams'; quantityG: number }
  | { mode: 'servings'; servings: number }

export function scaleNutrientsPer100g(food: Pick<Food, 'calories' | 'carbs_g' | 'protein_g' | 'fat_g' | 'serving_size_g'>, portion: PortionInput): NutrientTotals {
  const grams =
    portion.mode === 'grams'
      ? portion.quantityG
      : portion.servings * Number(food.serving_size_g)

  const factor = grams / 100

  return {
    calories: roundNutrient(Number(food.calories) * factor),
    carbsG: roundNutrient(Number(food.carbs_g) * factor),
    proteinG: roundNutrient(Number(food.protein_g) * factor),
    fatG: roundNutrient(Number(food.fat_g) * factor),
  }
}

export function roundNutrient(value: number) {
  return Math.round(value * 10) / 10
}

export function sumNutrients(entries: NutrientTotals[]): NutrientTotals {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      carbsG: acc.carbsG + entry.carbsG,
      proteinG: acc.proteinG + entry.proteinG,
      fatG: acc.fatG + entry.fatG,
    }),
    { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 },
  )
}

export function formatNutrient(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
