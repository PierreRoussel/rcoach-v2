import type { Food, MealLogEntry, MealType } from '@/lib/nutrition/types'
import type { PortionInput } from '@/lib/nutrition/nutrient-math'
import { scaleNutrientsPer100g } from '@/lib/nutrition/nutrient-math'
import { portionToStoredFields } from '@/lib/nutrition/portion-options'

export function buildPendingMealLogEntry(input: {
  id: string
  userId: string
  loggedDate: string
  mealType: MealType
  food: Food
  portion: PortionInput
}): MealLogEntry {
  const nutrients = scaleNutrientsPer100g(input.food, input.portion)
  const stored = portionToStoredFields(input.food, input.portion)
  const now = new Date().toISOString()

  return {
    id: input.id,
    user_id: input.userId,
    logged_date: input.loggedDate,
    meal_type: input.mealType,
    food_id: input.food.id,
    custom_name: null,
    quantity_g: stored.quantity_g,
    servings: stored.servings,
    calories: nutrients.calories,
    carbs_g: nutrients.carbsG,
    protein_g: nutrients.proteinG,
    fat_g: nutrients.fatG,
    created_at: now,
    updated_at: now,
    food: input.food,
  }
}

export function buildPendingQuickMealLogEntry(input: {
  id: string
  userId: string
  loggedDate: string
  mealType: MealType
  name: string
  calories: number
  carbsG: number
  proteinG: number
  fatG: number
}): MealLogEntry {
  const now = new Date().toISOString()

  return {
    id: input.id,
    user_id: input.userId,
    logged_date: input.loggedDate,
    meal_type: input.mealType,
    food_id: null,
    custom_name: input.name.trim(),
    quantity_g: null,
    servings: null,
    calories: input.calories,
    carbs_g: input.carbsG,
    protein_g: input.proteinG,
    fat_g: input.fatG,
    created_at: now,
    updated_at: now,
    food: null,
  }
}
