import { describe, expect, it } from 'vitest'

import {
  buildNutritionUpsertFromOnboarding,
  hasOnboardingBodyData,
} from '@/lib/onboarding/profile-form'

describe('buildNutritionUpsertFromOnboarding', () => {
  it('returns only provided fields', () => {
    expect(
      buildNutritionUpsertFromOnboarding({
        sex: 'female',
        age: '28',
        heightCm: '',
        weightKg: '62.5',
      }),
    ).toEqual({
      sex: 'female',
      age: 28,
      weight_kg: 62.5,
    })
  })

  it('returns empty object when everything is skipped', () => {
    expect(
      buildNutritionUpsertFromOnboarding({
        sex: null,
        age: '',
        heightCm: '',
        weightKg: '',
      }),
    ).toEqual({})
  })
})

describe('hasOnboardingBodyData', () => {
  it('detects partial body data', () => {
    expect(
      hasOnboardingBodyData({
        sex: null,
        age: '30',
        heightCm: '',
        weightKg: '',
      }),
    ).toBe(true)
  })
})
