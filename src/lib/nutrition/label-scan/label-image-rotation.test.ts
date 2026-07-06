import { describe, expect, it } from 'vitest'

import {
  buildLabelOcrRotationPlan,
  isLandscapeImage,
  osdOrientationToClockwiseRotation,
} from '@/lib/nutrition/label-scan/label-image-rotation'

describe('label-image-rotation helpers', () => {
  it('detects landscape images', () => {
    expect(isLandscapeImage({ width: 1920, height: 1080 })).toBe(true)
    expect(isLandscapeImage({ width: 1080, height: 1920 })).toBe(false)
  })

  it('maps OSD orientation to clockwise correction', () => {
    expect(osdOrientationToClockwiseRotation(90)).toBe(270)
    expect(osdOrientationToClockwiseRotation(270)).toBe(90)
    expect(osdOrientationToClockwiseRotation(180)).toBe(180)
  })

  it('prioritizes OSD hints then landscape-friendly rotations', () => {
    expect(buildLabelOcrRotationPlan([270], true)).toEqual([270, 90, 0, 180])
    expect(buildLabelOcrRotationPlan([], false)).toEqual([0, 90, 180, 270])
  })
})
