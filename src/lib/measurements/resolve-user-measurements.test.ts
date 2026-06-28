import { describe, expect, it } from 'vitest'

import {
  hasAnyResolvedMeasurements,
  hasResolvedBodyMeasurements,
  resolveUserMeasurements,
} from '@/lib/measurements/resolve-user-measurements'

describe('resolveUserMeasurements', () => {
  it('returns stored measurements', () => {
    expect(
      resolveUserMeasurements({
        sex: 'female',
        age: 28,
        height_cm: 165,
        waist_cm: 70,
      }),
    ).toEqual({
      sex: 'female',
      age: 28,
      height_cm: 165,
      waist_cm: 70,
    })
  })

  it('returns null when no measurements are stored', () => {
    expect(resolveUserMeasurements(null)).toBeNull()
  })

  it('keeps partial measurements', () => {
    expect(
      resolveUserMeasurements({
        sex: 'female',
        age: null,
        height_cm: null,
        waist_cm: null,
      }),
    ).toEqual({
      sex: 'female',
      age: null,
      height_cm: null,
      waist_cm: null,
    })
  })
})

describe('hasResolvedBodyMeasurements', () => {
  it('returns true when core body fields are stored', () => {
    expect(
      hasResolvedBodyMeasurements({
        sex: 'male',
        age: 30,
        height_cm: 175,
        waist_cm: null,
      }),
    ).toBe(true)
  })

  it('returns false when core body fields are missing', () => {
    expect(
      hasResolvedBodyMeasurements({
        sex: 'male',
        age: null,
        height_cm: 175,
        waist_cm: null,
      }),
    ).toBe(false)
  })
})

describe('hasAnyResolvedMeasurements', () => {
  it('returns true with any stored field', () => {
    expect(
      hasAnyResolvedMeasurements({
        sex: null,
        age: null,
        height_cm: 175,
        waist_cm: null,
      }),
    ).toBe(true)
  })
})
