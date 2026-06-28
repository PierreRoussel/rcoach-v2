import { describe, expect, it } from 'vitest'

import {
  hasAnyResolvedMeasurements,
  hasResolvedBodyMeasurements,
  resolveUserMeasurements,
} from '@/lib/measurements/resolve-user-measurements'

describe('resolveUserMeasurements', () => {
  it('prefers stored measurements over nutrition settings', () => {
    expect(
      resolveUserMeasurements(
        {
          sex: 'female',
          age: 28,
          height_cm: 165,
          waist_cm: 70,
        },
        {
          sex: 'male',
          age: 40,
          height_cm: 180,
        },
      ),
    ).toEqual({
      sex: 'female',
      age: 28,
      height_cm: 165,
      waist_cm: 70,
    })
  })

  it('falls back to nutrition settings for legacy users', () => {
    expect(
      resolveUserMeasurements(null, {
        sex: 'male',
        age: 35,
        height_cm: 178,
      }),
    ).toEqual({
      sex: 'male',
      age: 35,
      height_cm: 178,
      waist_cm: null,
    })
  })

  it('merges partial measurements with nutrition fallback', () => {
    expect(
      resolveUserMeasurements(
        {
          sex: 'female',
          age: null,
          height_cm: null,
          waist_cm: null,
        },
        {
          sex: 'male',
          age: 32,
          height_cm: 170,
        },
      ),
    ).toEqual({
      sex: 'female',
      age: 32,
      height_cm: 170,
      waist_cm: null,
    })
  })
})

describe('hasResolvedBodyMeasurements', () => {
  it('returns true when nutrition settings contain legacy body data', () => {
    expect(
      hasResolvedBodyMeasurements(null, {
        sex: 'male',
        age: 30,
        height_cm: 175,
      }),
    ).toBe(true)
  })
})

describe('hasAnyResolvedMeasurements', () => {
  it('returns true with only nutrition fallback', () => {
    expect(
      hasAnyResolvedMeasurements(null, {
        sex: 'male',
        age: 30,
        height_cm: 175,
      }),
    ).toBe(true)
  })
})
