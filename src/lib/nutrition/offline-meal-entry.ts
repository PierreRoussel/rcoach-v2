import type { Food, MealLogEntry, MealType } from '@/lib/nutrition/types'
import type { PortionInput } from '@/lib/nutrition/nutrient-math'
import { scaleNutrientsPer100g } from '@/lib/nutrition/nutrient-math'

export function buildPendingMealLogEntry(input: {
  id: string
  userId: string
  loggedDate: string
  mealType: MealType
  food: Food
  portion: PortionInput
}): MealLogEntry {
  const nutrients = scaleNutrientsPer100g(input.food, input.portion)
  const now = new Date().toISOString()

  return {
    id: input.id,
    user_id: input.userId,
    logged_date: input.loggedDate,
    meal_type: input.mealType,
    food_id: input.food.id,
    quantity_g: input.portion.mode === 'grams' ? input.portion.quantityG : null,
    servings: input.portion.mode === 'servings' ? input.portion.servings : null,
    calories: nutrients.calories,
    carbs_g: nutrients.carbsG,
    protein_g: nutrients.proteinG,
    fat_g: nutrients.fatG,
    created_at: now,
    updated_at: now,
    food: input.food,
  }
}
