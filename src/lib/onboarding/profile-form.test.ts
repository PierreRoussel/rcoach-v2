import { describe, expect, it } from 'vitest'

import {
  buildUserMeasurementsUpsertFromOnboarding,
  hasCompleteOnboardingBodyData,
  hasOnboardingBodyData,
  hasStoredOnboardingBodyData,
  parseOnboardingWeightKg,
  profileOnboardingFormFromStoredBodyData,
} from '@/lib/onboarding/profile-form'

describe('buildUserMeasurementsUpsertFromOnboarding', () => {
  it('returns only provided measurement fields', () => {
    expect(
      buildUserMeasurementsUpsertFromOnboarding({
        sex: 'female',
        age: '28',
        heightCm: '',
        waistCm: '68',
        weightKg: '62.5',
      }),
    ).toEqual({
      sex: 'female',
      age: 28,
      waist_cm: 68,
    })
  })

  it('returns empty object when everything is skipped', () => {
    expect(
      buildUserMeasurementsUpsertFromOnboarding({
        sex: null,
        age: '',
        heightCm: '',
        waistCm: '',
        weightKg: '',
      }),
    ).toEqual({})
  })
})

describe('parseOnboardingWeightKg', () => {
  it('parses weight when provided', () => {
    expect(
      parseOnboardingWeightKg({
        sex: null,
        age: '',
        heightCm: '',
        waistCm: '',
        weightKg: '74,5',
      }),
    ).toBe(74.5)
  })
})

describe('hasOnboardingBodyData', () => {
  it('detects partial body data', () => {
    expect(
      hasOnboardingBodyData({
        sex: null,
        age: '30',
        heightCm: '',
        waistCm: '',
        weightKg: '',
      }),
    ).toBe(true)
  })
})

describe('profileOnboardingFormFromStoredBodyData', () => {
  it('maps stored measurements and weight into form fields', () => {
    expect(
      profileOnboardingFormFromStoredBodyData(
        {
          sex: 'male',
          age: 32,
          height_cm: 178,
          waist_cm: 82,
        },
        74.5,
      ),
    ).toEqual({
      sex: 'male',
      age: '32',
      heightCm: '178',
      waistCm: '82',
      weightKg: '74.5',
    })
  })
})

describe('hasStoredOnboardingBodyData', () => {
  it('returns true when all onboarding measurement fields are stored', () => {
    expect(
      hasStoredOnboardingBodyData({
        sex: 'female',
        age: 28,
        height_cm: 165,
        waist_cm: 70,
      }),
    ).toBe(true)
  })

  it('returns false when stored data is incomplete', () => {
    expect(
      hasStoredOnboardingBodyData({
        sex: 'female',
        age: 28,
        height_cm: null,
        waist_cm: 70,
      }),
    ).toBe(false)
  })
})

describe('hasCompleteOnboardingBodyData', () => {
  it('requires every measurement field in the form', () => {
    expect(
      hasCompleteOnboardingBodyData({
        sex: 'female',
        age: '28',
        heightCm: '165',
        waistCm: '',
        weightKg: '60',
      }),
    ).toBe(false)
  })
})
