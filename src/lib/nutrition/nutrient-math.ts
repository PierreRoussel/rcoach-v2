import type { Food } from '@/lib/nutrition/types'

export type NutrientTotals = {
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
}

export type ExtendedNutrientTotals = NutrientTotals & {
  saltG: number | null
  sugarG: number | null
  saturatedFatG: number | null
}

type ScalableFood = Pick<
  Food,
  | 'calories'
  | 'carbs_g'
  | 'protein_g'
  | 'fat_g'
  | 'serving_size_g'
  | 'salt_g'
  | 'sugar_g'
  | 'saturated_fat_g'
>

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

function portionGrams(food: Pick<Food, 'serving_size_g'>, portion: PortionInput) {
  return portion.mode === 'grams'
    ? portion.quantityG
    : portion.servings * Number(food.serving_size_g)
}

function scaleOptionalNutrient(value: number | null | undefined, factor: number) {
  if (value == null || Number.isNaN(Number(value))) {
    return null
  }

  return roundNutrient(Number(value) * factor)
}

export function scaleExtendedNutrients(
  food: ScalableFood,
  portion: PortionInput,
): ExtendedNutrientTotals {
  const factor = portionGrams(food, portion) / 100
  const base = scaleNutrientsPer100g(food, portion)

  return {
    ...base,
    saltG: scaleOptionalNutrient(food.salt_g, factor),
    sugarG: scaleOptionalNutrient(food.sugar_g, factor),
    saturatedFatG: scaleOptionalNutrient(food.saturated_fat_g, factor),
  }
}

export function sumExtendedNutrients(entries: ExtendedNutrientTotals[]): ExtendedNutrientTotals {
  let saltTotal = 0
  let sugarTotal = 0
  let saturatedFatTotal = 0
  let hasSalt = false
  let hasSugar = false
  let hasSaturatedFat = false

  const base = entries.reduce(
    (acc, entry) => {
      if (entry.saltG != null) {
        hasSalt = true
        saltTotal += entry.saltG
      }
      if (entry.sugarG != null) {
        hasSugar = true
        sugarTotal += entry.sugarG
      }
      if (entry.saturatedFatG != null) {
        hasSaturatedFat = true
        saturatedFatTotal += entry.saturatedFatG
      }

      return {
        calories: acc.calories + entry.calories,
        carbsG: acc.carbsG + entry.carbsG,
        proteinG: acc.proteinG + entry.proteinG,
        fatG: acc.fatG + entry.fatG,
      }
    },
    { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 },
  )

  return {
    ...base,
    saltG: hasSalt ? roundNutrient(saltTotal) : null,
    sugarG: hasSugar ? roundNutrient(sugarTotal) : null,
    saturatedFatG: hasSaturatedFat ? roundNutrient(saturatedFatTotal) : null,
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
