import { describe, expect, it } from 'vitest'

import {
  buildNutritionHintMetrics,
  type NutritionHintMetrics,
} from '@/lib/nutrition/nutrition-hint-metrics'
import {
  getNutritionHintRules,
  isActionableNutritionHint,
  isNutritionHintVisible,
  pickNutritionHint,
} from '@/lib/nutrition/nutrition-hints'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import type { MealLogEntry, NutritionSettings } from '@/lib/nutrition/types'

function baseSettings(overrides: Partial<NutritionSettings> = {}): NutritionSettings {
  return {
    user_id: 'user-1',
    daily_calorie_target: 2000,
    carbs_pct: 45,
    protein_pct: 25,
    fat_pct: 30,
    breakfast_pct: 25,
    lunch_pct: 35,
    snack_pct: 10,
    dinner_pct: 30,
    activity_level: 'moderate',
    calorie_adjustment: 0,
    tdee_calculated: 2200,
    onboarded_at: '2026-01-01',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

function entry(
  overrides: Partial<MealLogEntry> & Pick<MealLogEntry, 'logged_date' | 'meal_type'>,
): MealLogEntry {
  return {
    id: overrides.id ?? `entry-${Math.random()}`,
    user_id: 'user-1',
    food_id: overrides.food_id ?? 'food-1',
    custom_name: overrides.custom_name ?? null,
    quantity_g: overrides.quantity_g ?? 200,
    servings: overrides.servings ?? null,
    calories: overrides.calories ?? 400,
    carbs_g: overrides.carbs_g ?? 40,
    protein_g: overrides.protein_g ?? 20,
    fat_g: overrides.fat_g ?? 15,
    created_at: '2026-06-01',
    updated_at: '2026-06-01',
    food: overrides.food ?? {
      id: 'food-1',
      user_id: null,
      barcode: null,
      name: 'Poulet',
      brand: null,
      calories: 200,
      carbs_g: 0,
      protein_g: 20,
      fat_g: 10,
      salt_g: 0.5,
      sugar_g: 0,
      saturated_fat_g: 2,
      serving_size_g: 100,
      serving_label: '100 g',
      source: 'ciqual',
      off_product_id: null,
      ciqual_code: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    ...overrides,
  }
}

function metricsFromEntries(
  anchorDate: string,
  entries: MealLogEntry[],
  settings = baseSettings(),
): NutritionHintMetrics {
  const byDate = new Map<string, MealLogEntry[]>()
  for (const item of entries) {
    const bucket = byDate.get(item.logged_date) ?? []
    bucket.push(item)
    byDate.set(item.logged_date, bucket)
  }

  return buildNutritionHintMetrics(anchorDate, byDate, settings, 75)
}

describe('nutrition hints engine', () => {
  it('defines at least 55 rules', () => {
    expect(getNutritionHintRules().length).toBeGreaterThanOrEqual(55)
  })

  it('returns no-entries hint when journal is empty', () => {
    const metrics = metricsFromEntries('2026-06-03', [])
    expect(pickNutritionHint(metrics).id).toBe('no-entries')
  })

  it('marks journal prompts as non-actionable for FAB visibility', () => {
    expect(isActionableNutritionHint('no-entries')).toBe(false)
    expect(isActionableNutritionHint('very-few-entries')).toBe(false)
    expect(isActionableNutritionHint('keep-logging')).toBe(false)
    expect(isActionableNutritionHint('protein-low')).toBe(true)
    expect(isActionableNutritionHint('salt-very-high')).toBe(true)
  })

  it('prioritizes very low protein over encouragement', () => {
    const metrics = metricsFromEntries('2026-06-03', [
      entry({
        logged_date: '2026-06-01',
        meal_type: 'lunch',
        protein_g: 30,
        calories: 1800,
        carbs_g: 220,
        fat_g: 60,
      }),
      entry({
        logged_date: '2026-06-02',
        meal_type: 'lunch',
        protein_g: 30,
        calories: 1800,
        carbs_g: 220,
        fat_g: 60,
      }),
      entry({
        logged_date: '2026-06-03',
        meal_type: 'lunch',
        protein_g: 30,
        calories: 1800,
        carbs_g: 220,
        fat_g: 60,
      }),
    ])

    expect(pickNutritionHint(metrics).id).toBe('protein-very-low')
  })

  it('flags high salt when food data is available', () => {
    const saltyFood = {
      ...entry({ logged_date: '2026-06-01', meal_type: 'lunch' }).food!,
      salt_g: 4,
    }

    const metrics = metricsFromEntries('2026-06-03', [
      entry({
        logged_date: '2026-06-01',
        meal_type: 'lunch',
        quantity_g: 300,
        calories: 1800,
        protein_g: 120,
        carbs_g: 180,
        fat_g: 50,
        food: saltyFood,
      }),
      entry({
        logged_date: '2026-06-02',
        meal_type: 'lunch',
        quantity_g: 300,
        calories: 1800,
        protein_g: 120,
        carbs_g: 180,
        fat_g: 50,
        food: saltyFood,
      }),
      entry({
        logged_date: '2026-06-03',
        meal_type: 'lunch',
        quantity_g: 300,
        calories: 1800,
        protein_g: 120,
        carbs_g: 180,
        fat_g: 50,
        food: saltyFood,
      }),
    ])

    expect(pickNutritionHint(metrics).id).toBe('salt-very-high')
  })

  it('handles quick entries without extended nutrients', () => {
    const metrics = metricsFromEntries('2026-06-03', [
      entry({
        logged_date: '2026-06-01',
        meal_type: 'lunch',
        food_id: null,
        custom_name: 'Repas maison',
        food: null,
      }),
      entry({
        logged_date: '2026-06-02',
        meal_type: 'dinner',
        food_id: null,
        custom_name: 'Salade',
        food: null,
      }),
      entry({
        logged_date: '2026-06-03',
        meal_type: 'breakfast',
        food_id: null,
        custom_name: 'Toast',
        food: null,
      }),
    ])

    expect(metrics.hasSaltData).toBe(false)
    expect(pickNutritionHint(metrics).id).not.toBe('salt-high')
  })

  it('uses anchor day calories when the viewed day is over target', () => {
    const metrics = metricsFromEntries('2026-06-26', [
      entry({
        logged_date: '2026-06-24',
        meal_type: 'lunch',
        calories: 1900,
        protein_g: 90,
        carbs_g: 200,
        fat_g: 60,
      }),
      entry({
        logged_date: '2026-06-25',
        meal_type: 'lunch',
        calories: 2100,
        protein_g: 100,
        carbs_g: 210,
        fat_g: 65,
      }),
      entry({
        logged_date: '2026-06-26',
        meal_type: 'lunch',
        calories: 3207,
        protein_g: 166,
        carbs_g: 316,
        fat_g: 132,
      }),
    ])

    expect(metrics.primaryDaily.calories).toBe(3207)
    expect(pickNutritionHint(metrics).id).toBe('calories-very-high')
  })

  it('hides hint on today when anchor day calories are still too low', () => {
    const today = toDateKey(new Date())
    const metrics = metricsFromEntries(today, [
      entry({
        logged_date: today,
        meal_type: 'breakfast',
        calories: 350,
        protein_g: 15,
        carbs_g: 40,
        fat_g: 10,
      }),
      entry({
        logged_date: addDays(today, -1),
        meal_type: 'lunch',
        calories: 3207,
        protein_g: 166,
        carbs_g: 316,
        fat_g: 132,
      }),
      entry({
        logged_date: addDays(today, -2),
        meal_type: 'lunch',
        calories: 1800,
        protein_g: 120,
        carbs_g: 180,
        fat_g: 50,
      }),
    ])

    const hint = pickNutritionHint(metrics)
    expect(isActionableNutritionHint(hint.id)).toBe(true)
    expect(isNutritionHintVisible(metrics, hint.id)).toBe(false)
  })

  it('does not warn low calories when only the current day is low', () => {
    const today = toDateKey(new Date())
    const metrics = metricsFromEntries(today, [
      entry({
        logged_date: today,
        meal_type: 'breakfast',
        calories: 350,
        protein_g: 15,
        carbs_g: 40,
        fat_g: 10,
      }),
      entry({
        logged_date: addDays(today, -1),
        meal_type: 'lunch',
        calories: 3207,
        protein_g: 166,
        carbs_g: 316,
        fat_g: 132,
      }),
    ])

    const hint = pickNutritionHint(metrics)
    expect(hint.id).not.toBe('calories-very-low')
    expect(hint.id).not.toBe('calories-low')
  })

  it('warns low calories when the two previous days were consistently low', () => {
    const today = toDateKey(new Date())
    const metrics = metricsFromEntries(today, [
      entry({
        logged_date: today,
        meal_type: 'breakfast',
        calories: 350,
        protein_g: 15,
        carbs_g: 40,
        fat_g: 10,
      }),
      entry({
        logged_date: addDays(today, -1),
        meal_type: 'lunch',
        calories: 1200,
        protein_g: 60,
        carbs_g: 120,
        fat_g: 30,
      }),
      entry({
        logged_date: addDays(today, -2),
        meal_type: 'lunch',
        calories: 1100,
        protein_g: 55,
        carbs_g: 110,
        fat_g: 28,
      }),
    ])

    expect(pickNutritionHint(metrics).id).toBe('calories-very-low')
    expect(isNutritionHintVisible(metrics, 'calories-very-low')).toBe(true)
  })

  it('uses stable tie-break when priorities are equal', () => {
    const metrics = metricsFromEntries('2026-06-03', [
      entry({ logged_date: '2026-06-03', meal_type: 'lunch' }),
    ])

    const first = pickNutritionHint(metrics)
    const second = pickNutritionHint(metrics)
    expect(first.id).toBe(second.id)
  })
})
