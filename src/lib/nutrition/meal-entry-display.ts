import { formatNutrient } from '@/lib/nutrition/nutrient-math'
import type { MealLogEntry } from '@/lib/nutrition/types'

export function isQuickMealEntry(entry: Pick<MealLogEntry, 'food_id'>): boolean {
  return entry.food_id == null
}

export function getMealEntryName(entry: Pick<MealLogEntry, 'custom_name' | 'food'>): string {
  if (entry.custom_name?.trim()) {
    return entry.custom_name.trim()
  }

  return entry.food?.name ?? 'Aliment'
}

export function resolveMealEntryQuantityGrams(
  quantityG: number | null,
  servings: number | null,
  servingSizeG: number,
) {
  if (quantityG != null) {
    return Number(quantityG)
  }

  if (servings != null) {
    return servings * servingSizeG
  }

  return null
}

export function formatMealEntryQuantityGrams(
  quantityG: number | null,
  servings: number | null,
  servingSizeG: number,
) {
  const grams = resolveMealEntryQuantityGrams(quantityG, servings, servingSizeG)
  return grams != null ? `${formatNutrient(grams)} g` : null
}

export function formatMealEntryQuantity(entry: MealLogEntry) {
  if (!entry.food) {
    return null
  }

  return formatMealEntryQuantityGrams(
    entry.quantity_g,
    entry.servings,
    Number(entry.food.serving_size_g),
  )
}
