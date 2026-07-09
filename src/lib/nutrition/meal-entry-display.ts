import { mealLogEntryToPortion } from '@/lib/nutrition/frequent-portion'
import { formatNutrient, type PortionInput } from '@/lib/nutrition/nutrient-math'
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

const GRAM_SERVING_LABEL = /^\d+(\.\d+)?\s*g$/i

function pluralizePortionLabel(label: string, count: number) {
  if (count <= 1 || label.endsWith('s')) {
    return label
  }

  return `${label}s`
}

export function formatMealEntryQuantityFields(
  quantityG: number | null,
  servings: number | null,
  servingLabel: string,
) {
  if (servings != null) {
    const count = Number(servings)
    if (!Number.isFinite(count) || count <= 0) {
      return null
    }

    const formatted = formatNutrient(count)
    const label = servingLabel.trim()

    if (!label || GRAM_SERVING_LABEL.test(label)) {
      return count <= 1 ? `${formatted} portion` : `${formatted} portions`
    }

    return `${formatted} ${pluralizePortionLabel(label, count)}`
  }

  if (quantityG != null) {
    const grams = Number(quantityG)
    if (!Number.isFinite(grams) || grams <= 0) {
      return null
    }

    return `${formatNutrient(grams)} g`
  }

  return null
}

export function formatMealEntryQuantity(entry: MealLogEntry) {
  if (!entry.food) {
    return null
  }

  return formatMealEntryQuantityFields(
    entry.quantity_g,
    entry.servings,
    entry.food.serving_label,
  )
}

export function mealEntryToPortionInput(
  entry: Pick<MealLogEntry, 'quantity_g' | 'servings'>,
): PortionInput | null {
  if (entry.quantity_g == null && entry.servings == null) {
    return null
  }

  return mealLogEntryToPortion(entry)
}
