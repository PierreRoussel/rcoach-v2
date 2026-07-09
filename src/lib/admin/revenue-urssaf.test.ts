import { describe, expect, it } from 'vitest'

import {
  AUTO_ENTREPRENEUR_BNC_URSSAF_RATE,
  displayRevenueCents,
  revenueCentsAfterUrssaf,
} from '@/lib/admin/revenue-urssaf'

describe('revenue-urssaf', () => {
  it('uses 22% BNC auto-entrepreneur rate', () => {
    expect(AUTO_ENTREPRENEUR_BNC_URSSAF_RATE).toBe(0.22)
  })

  it('deducts URSSAF from gross cents', () => {
    expect(revenueCentsAfterUrssaf(10000)).toBe(7800)
    expect(revenueCentsAfterUrssaf(999)).toBe(779)
  })

  it('returns gross when switch is off', () => {
    expect(displayRevenueCents(999, false)).toBe(999)
    expect(displayRevenueCents(999, true)).toBe(779)
  })
})
