import { describe, expect, it } from 'vitest'

import {
  getBadgeTileSrc,
  getBadgeViewBox,
  hasBadgeAsset,
} from '@/lib/gamification/badge-assets'

describe('badge-assets', () => {
  it('exposes per-badge tile SVG paths', () => {
    expect(hasBadgeAsset('sessions_100')).toBe(true)
    expect(getBadgeTileSrc('sessions_100')).toBe('/badges/tiles/sessions_100.svg')
    expect(getBadgeViewBox('sessions_365')).toEqual({
      x: 300,
      y: 500,
      w: 192,
      h: 264,
    })
  })

  it('returns null for unknown keys', () => {
    expect(hasBadgeAsset('unknown_badge')).toBe(false)
    expect(getBadgeTileSrc('unknown_badge')).toBeNull()
  })
})
