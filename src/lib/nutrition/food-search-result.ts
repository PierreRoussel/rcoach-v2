import type { OffFoodDraft } from '@/lib/nutrition/open-food-facts'
import type { PortionInput } from '@/lib/nutrition/nutrient-math'
import type { Food } from '@/lib/nutrition/types'

export type FoodSearchResult = {
  id: string
  name: string
  brand: string | null
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
  servingSizeG: number
  servingLabel: string
  source: Food['source'] | 'open_food_facts_live'
  barcode?: string | null
  offProductId?: string | null
  food?: Food
  offDraft?: OffFoodDraft
  quickAddPortion?: PortionInput
  usageBadge?: 'recent' | 'frequent'
}

function toFoodNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeFoodNutrients(food: Food): Food {
  const servingSizeG = toFoodNumber(food.serving_size_g, 100)

  return {
    ...food,
    calories: toFoodNumber(food.calories),
    carbs_g: toFoodNumber(food.carbs_g),
    protein_g: toFoodNumber(food.protein_g),
    fat_g: toFoodNumber(food.fat_g),
    serving_size_g: servingSizeG > 0 ? servingSizeG : 100,
    serving_label: food.serving_label || '100 g',
  }
}

export function mapFoodToSearchResult(
  food: Food,
  quickAddPortion?: PortionInput,
): FoodSearchResult {
  const normalized = normalizeFoodNutrients(food)

  return {
    id: normalized.id,
    name: normalized.name,
    brand: normalized.brand,
    calories: normalized.calories,
    carbsG: normalized.carbs_g,
    proteinG: normalized.protein_g,
    fatG: normalized.fat_g,
    servingSizeG: normalized.serving_size_g,
    servingLabel: normalized.serving_label,
    source: normalized.source,
    barcode: normalized.barcode,
    offProductId: normalized.off_product_id,
    food: normalized,
    quickAddPortion,
  }
}
