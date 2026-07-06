import {
  formatNutrient,
  portionGrams,
  scaleNutrientsPer100g,
  type PortionInput,
} from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

export type MealLogPortionEntry = {
  food_id: string | null
  quantity_g: number | null
  servings: number | null
}

export type FrequentFood = {
  food: Food
  portion: PortionInput
}

export function mealLogEntryToPortion(
  entry: Pick<MealLogPortionEntry, 'quantity_g' | 'servings'>,
): PortionInput {
  if (entry.quantity_g != null) {
    return { mode: 'grams', quantityG: Number(entry.quantity_g) }
  }

  if (entry.servings != null) {
    return { mode: 'servings', servings: Number(entry.servings) }
  }

  return { mode: 'servings', servings: 1 }
}

function portionFingerprint(portion: PortionInput) {
  if (portion.mode === 'grams') {
    return `g:${portion.quantityG}`
  }

  return `s:${portion.servings}:${portion.servingSizeG ?? 'default'}`
}

export function pickMostFrequentPortion<T extends Pick<MealLogPortionEntry, 'quantity_g' | 'servings'>>(
  entries: T[],
): PortionInput {
  const counts = new Map<string, { portion: PortionInput; count: number }>()

  for (const entry of entries) {
    const portion = mealLogEntryToPortion(entry)
    const key = portionFingerprint(portion)
    const current = counts.get(key)

    if (current) {
      current.count += 1
    } else {
      counts.set(key, { portion, count: 1 })
    }
  }

  return [...counts.values()].sort((left, right) => right.count - left.count)[0]?.portion ?? {
    mode: 'servings',
    servings: 1,
  }
}

export function buildFrequentFoods(
  entries: Array<MealLogPortionEntry & { food: Food | null }>,
  limit: number,
): FrequentFood[] {
  const byFood = new Map<
    string,
    {
      food: Food
      entries: Array<Pick<MealLogPortionEntry, 'quantity_g' | 'servings'>>
      count: number
    }
  >()

  for (const entry of entries) {
    if (!entry.food_id || !entry.food) {
      continue
    }

    const current = byFood.get(entry.food_id)

    if (current) {
      current.count += 1
      current.entries.push(entry)
    } else {
      byFood.set(entry.food_id, {
        food: entry.food,
        entries: [entry],
        count: 1,
      })
    }
  }

  return [...byFood.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, limit)
    .map(({ food, entries: foodEntries }) => ({
      food,
      portion: pickMostFrequentPortion(foodEntries),
    }))
}

export function formatFoodPortionPreview(
  food: Pick<Food, 'calories' | 'carbs_g' | 'protein_g' | 'fat_g' | 'serving_size_g'>,
  portion: PortionInput,
) {
  const scaled = scaleNutrientsPer100g(food, portion)
  const grams = portionGrams(food, portion)

  return `${formatNutrient(grams)} g · ${Math.round(scaled.calories)} kcal`
}
