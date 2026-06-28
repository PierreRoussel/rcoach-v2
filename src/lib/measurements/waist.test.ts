import { describe, expect, it } from 'vitest'

import {
  clampWaistCm,
  formatWaistCmWithUnit,
  hasWaistChanged,
  nearestWaistOption,
} from '@/lib/measurements/waist'

describe('waist helpers', () => {
  it('formats values with cm unit', () => {
    expect(formatWaistCmWithUnit(82)).toBe('82 cm')
    expect(formatWaistCmWithUnit(82.5)).toBe('82,5 cm')
  })

  it('snaps to the nearest half centimeter option', () => {
    expect(nearestWaistOption(82.2)).toBe(82)
    expect(nearestWaistOption(82.3)).toBe(82.5)
  })

  it('detects meaningful waist changes', () => {
    expect(hasWaistChanged(82, 82.04)).toBe(false)
    expect(hasWaistChanged(82, 82.5)).toBe(true)
  })

  it('clamps out-of-range values', () => {
    expect(clampWaistCm(40)).toBe(50)
    expect(clampWaistCm(200)).toBe(180)
  })
})
