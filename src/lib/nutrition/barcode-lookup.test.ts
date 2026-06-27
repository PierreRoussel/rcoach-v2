import { describe, expect, it } from 'vitest'

import {
  buildBarcodeLookupVariants,
  normalizeBarcodeInput,
} from '@/lib/nutrition/barcode-lookup'

describe('barcode lookup helpers', () => {
  it('normalizes barcode input to digits', () => {
    expect(normalizeBarcodeInput(' 3017620422003 ')).toBe('3017620422003')
  })

  it('builds EAN variants with and without leading zero', () => {
    expect(buildBarcodeLookupVariants('301762042200')).toEqual([
      '301762042200',
      '0301762042200',
    ])
    expect(buildBarcodeLookupVariants('3017620422003')).toEqual([
      '3017620422003',
      '03017620422003',
    ])
    expect(buildBarcodeLookupVariants('03017620422003')).toEqual([
      '03017620422003',
      '3017620422003',
    ])
  })
})
