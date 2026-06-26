export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export type FoodSource = 'user' | 'open_food_facts'

export type NutritionSex = 'male' | 'female'

export type NutritionGoal = 'lose' | 'maintain' | 'gain'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export type NutritionSettings = {
  user_id: string
  daily_calorie_target: number
  carbs_pct: number
  protein_pct: number
  fat_pct: number
  breakfast_pct: number
  lunch_pct: number
  snack_pct: number
  dinner_pct: number
  sex: NutritionSex | null
  age: number | null
  height_cm: number | null
  weight_kg: number | null
  activity_level: ActivityLevel | null
  goal: NutritionGoal | null
  calorie_adjustment: number
  tdee_calculated: number | null
  onboarded_at: string | null
  created_at: string
  updated_at: string
}

export type Food = {
  id: string
  user_id: string | null
  barcode: string | null
  name: string
  brand: string | null
  calories: number
  carbs_g: number
  protein_g: number
  fat_g: number
  salt_g: number | null
  sugar_g: number | null
  saturated_fat_g: number | null
  serving_size_g: number
  serving_label: string
  source: FoodSource
  off_product_id: string | null
  created_at: string
  updated_at: string
}

export type MealLogEntry = {
  id: string
  user_id: string
  logged_date: string
  meal_type: MealType
  food_id: string | null
  custom_name: string | null
  quantity_g: number | null
  servings: number | null
  calories: number
  carbs_g: number
  protein_g: number
  fat_g: number
  created_at: string
  updated_at: string
  food: Food | null
}

export type FoodFavorite = {
  id: string
  user_id: string
  food_id: string
  created_at: string
  food: Food
}

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Petit déjeuner',
  lunch: 'Repas',
  snack: 'Goûter',
  dinner: 'Dîner',
}
