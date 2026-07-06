import { describe, expect, it } from 'vitest'

import { isOcrReadyDimensions } from '@/lib/nutrition/label-scan/label-image-bounds'

describe('label-image-bounds', () => {
  it('accepts images large enough for OCR', () => {
    expect(isOcrReadyDimensions(1600, 900)).toBe(true)
  })

  it('rejects tiny images', () => {
    expect(isOcrReadyDimensions(2, 36)).toBe(false)
  })
})
