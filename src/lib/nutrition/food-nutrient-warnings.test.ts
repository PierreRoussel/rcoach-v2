import { describe, expect, it } from 'vitest'

import {
  getFoodNutrientWarning,
  type FoodNutrientInputValues,
} from '@/lib/nutrition/food-nutrient-warnings'

const BASE: FoodNutrientInputValues = {
  calories: '0',
  carbsG: '0',
  proteinG: '0',
  fatG: '0',
  saltG: '',
  sugarG: '',
  saturatedFatG: '',
  servingSizeG: '100',
}

describe('getFoodNutrientWarning', () => {
  it('flags very high calories per 100 g', () => {
    expect(getFoodNutrientWarning('calories', '2000', BASE)).toMatch(/élevé|impossible/)
  })

  it('flags incoherent calories vs macros', () => {
    const values: FoodNutrientInputValues = {
      ...BASE,
      calories: '500',
      carbsG: '10',
      proteinG: '5',
      fatG: '2',
    }

    expect(getFoodNutrientWarning('calories', '500', values)).toMatch(/cohérent/)
  })

  it('flags sugar above carbs', () => {
    const values: FoodNutrientInputValues = {
      ...BASE,
      carbsG: '10',
      sugarG: '25',
    }

    expect(getFoodNutrientWarning('sugarG', '25', values)).toMatch(/sucres/)
  })

  it('ignores empty optional fields', () => {
    expect(getFoodNutrientWarning('saltG', '', BASE)).toBeNull()
  })

  it('accepts typical beverage values', () => {
    const values: FoodNutrientInputValues = {
      ...BASE,
      calories: '42',
      carbsG: '10.6',
      proteinG: '0',
      fatG: '0',
    }

    expect(getFoodNutrientWarning('calories', '42', values)).toBeNull()
  })
})
