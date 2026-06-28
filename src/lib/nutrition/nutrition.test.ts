import { describe, expect, it } from 'vitest'

import { calculateBmr, calculateTdee, macroGramsFromPercentages } from '@/lib/nutrition/tdee'
import { getMealCalorieTarget } from '@/lib/nutrition/meal-targets'
import type { NutritionSettings } from '@/lib/nutrition/types'
import { scaleNutrientsPer100g } from '@/lib/nutrition/nutrient-math'

const baseSettings: NutritionSettings = {
  user_id: 'user-1',
  daily_calorie_target: 2000,
  carbs_pct: 40,
  protein_pct: 30,
  fat_pct: 30,
  breakfast_pct: 20,
  lunch_pct: 35,
  snack_pct: 10,
  dinner_pct: 35,
  activity_level: 'moderate',
  calorie_adjustment: 0,
  tdee_calculated: 2500,
  onboarded_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('tdee', () => {
  it('calculates male bmr with Mifflin-St Jeor', () => {
    expect(
      calculateBmr({
        sex: 'male',
        age: 30,
        heightCm: 180,
        weightKg: 80,
      }),
    ).toBe(1780)
  })

  it('applies goal adjustment for weight loss', () => {
    const result = calculateTdee({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderate',
      goal: 'lose',
    })

    expect(result.dailyTarget).toBe(result.tdee - 500)
  })
})

describe('meal targets', () => {
  it('derives breakfast calories from daily target', () => {
    expect(getMealCalorieTarget(baseSettings, 'breakfast')).toBe(400)
  })
})

describe('nutrient math', () => {
  it('scales nutrients for grams and servings', () => {
    const food = {
      calories: 200,
      carbs_g: 20,
      protein_g: 10,
      fat_g: 5,
      serving_size_g: 50,
    }

    expect(scaleNutrientsPer100g(food, { mode: 'grams', quantityG: 100 })).toEqual({
      calories: 200,
      carbsG: 20,
      proteinG: 10,
      fatG: 5,
    })

    expect(scaleNutrientsPer100g(food, { mode: 'servings', servings: 2 })).toEqual({
      calories: 200,
      carbsG: 20,
      proteinG: 10,
      fatG: 5,
    })
  })

  it('converts macro percentages to grams', () => {
    expect(macroGramsFromPercentages(2000, 40, 30, 30)).toEqual({
      carbsG: 200,
      proteinG: 150,
      fatG: 67,
    })
  })
})
