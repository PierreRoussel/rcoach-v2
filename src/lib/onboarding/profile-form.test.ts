import { describe, expect, it } from 'vitest'

import {
  buildNutritionUpsertFromOnboarding,
  hasCompleteOnboardingBodyData,
  hasOnboardingBodyData,
  hasStoredOnboardingBodyData,
  profileOnboardingFormFromStoredBodyData,
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

describe('profileOnboardingFormFromStoredBodyData', () => {
  it('maps stored nutrition settings into form fields', () => {
    expect(
      profileOnboardingFormFromStoredBodyData({
        sex: 'male',
        age: 32,
        height_cm: 178,
        weight_kg: 74.5,
      }),
    ).toEqual({
      sex: 'male',
      age: '32',
      heightCm: '178',
      weightKg: '74.5',
    })
  })
})

describe('hasStoredOnboardingBodyData', () => {
  it('returns true when all onboarding body fields are stored', () => {
    expect(
      hasStoredOnboardingBodyData({
        sex: 'female',
        age: 28,
        height_cm: 165,
        weight_kg: 60,
      }),
    ).toBe(true)
  })

  it('returns false when stored data is incomplete', () => {
    expect(
      hasStoredOnboardingBodyData({
        sex: 'female',
        age: 28,
        height_cm: null,
        weight_kg: 60,
      }),
    ).toBe(false)
  })
})

describe('hasCompleteOnboardingBodyData', () => {
  it('requires every onboarding field in the form', () => {
    expect(
      hasCompleteOnboardingBodyData({
        sex: 'female',
        age: '28',
        heightCm: '165',
        weightKg: '',
      }),
    ).toBe(false)
  })
})
