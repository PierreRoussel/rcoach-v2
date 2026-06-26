import { describe, expect, it } from 'vitest'

import { buildLocalFood, toLocalFoodId } from '@/lib/nutrition/offline-food'
import { buildPendingMealLogEntry, buildPendingQuickMealLogEntry } from '@/lib/nutrition/offline-meal-entry'

describe('offline food', () => {
  it('creates a local food with prefixed id', () => {
    const food = buildLocalFood(
      {
        name: 'Pomme',
        calories: 52,
        carbs_g: 12,
        protein_g: 0,
        fat_g: 0,
        serving_size_g: 100,
        serving_label: '100 g',
        source: 'user',
      },
      'user-1',
      'abc-123',
    )

    expect(food.id).toBe(toLocalFoodId('abc-123'))
    expect(food.name).toBe('Pomme')
  })
})

describe('offline meal entry', () => {
  it('builds a pending meal log entry from food and portion', () => {
    const food = buildLocalFood(
      {
        name: 'Riz',
        calories: 130,
        carbs_g: 28,
        protein_g: 2,
        fat_g: 0,
        serving_size_g: 100,
        serving_label: '100 g',
        source: 'user',
      },
      'user-1',
    )

    const entry = buildPendingMealLogEntry({
      id: 'entry-1',
      userId: 'user-1',
      loggedDate: '2026-06-25',
      mealType: 'lunch',
      food,
      portion: { mode: 'grams', quantityG: 150 },
    })

    expect(entry.calories).toBe(195)
    expect(entry.food?.name).toBe('Riz')
    expect(entry.meal_type).toBe('lunch')
  })

  it('builds a pending quick meal log entry', () => {
    const entry = buildPendingQuickMealLogEntry({
      id: 'entry-2',
      userId: 'user-1',
      loggedDate: '2026-06-25',
      mealType: 'snack',
      name: 'Barre maison',
      calories: 220,
      carbsG: 30,
      proteinG: 8,
      fatG: 9,
    })

    expect(entry.food_id).toBeNull()
    expect(entry.custom_name).toBe('Barre maison')
    expect(entry.calories).toBe(220)
    expect(entry.food).toBeNull()
  })
})
