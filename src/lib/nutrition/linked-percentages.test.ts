import { describe, expect, it } from 'vitest'

import {
  adjustLinkedPercentages,
  mealCaloriesFromPercent,
} from '@/lib/nutrition/linked-percentages'

const defaultMeals = {
  breakfast: 20,
  lunch: 35,
  snack: 10,
  dinner: 35,
}

describe('adjustLinkedPercentages', () => {
  it('keeps total at 100 when one meal increases', () => {
    const next = adjustLinkedPercentages(defaultMeals, 'breakfast', 30)

    expect(next.breakfast).toBe(30)
    expect(next.lunch + next.snack + next.dinner).toBe(70)
    expect(next.breakfast + next.lunch + next.snack + next.dinner).toBe(100)
  })

  it('keeps total at 100 when one meal decreases', () => {
    const next = adjustLinkedPercentages(defaultMeals, 'lunch', 25)

    expect(next.lunch).toBe(25)
    expect(next.breakfast + next.snack + next.dinner).toBe(75)
    expect(next.breakfast + next.lunch + next.snack + next.dinner).toBe(100)
  })

  it('respects minimum per meal', () => {
    const next = adjustLinkedPercentages(defaultMeals, 'breakfast', 85)

    expect(next.breakfast).toBe(85)
    expect(next.lunch).toBeGreaterThanOrEqual(5)
    expect(next.snack).toBeGreaterThanOrEqual(5)
    expect(next.dinner).toBeGreaterThanOrEqual(5)
    expect(next.breakfast + next.lunch + next.snack + next.dinner).toBe(100)
  })
})

describe('mealCaloriesFromPercent', () => {
  it('derives meal calories from daily target', () => {
    expect(mealCaloriesFromPercent(2000, 20)).toBe(400)
    expect(mealCaloriesFromPercent(2200, 35)).toBe(770)
  })
})
