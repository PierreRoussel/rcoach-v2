import { describe, expect, it } from 'vitest'

import {
  computeRollingActiveUsers,
  formatCentsToEuros,
  funnelStepRate,
  resolveAdminMetricsDateRange,
} from '@/lib/admin/metrics-range'

describe('resolveAdminMetricsDateRange', () => {
  it('resolves a 30-day inclusive window by default', () => {
    expect(resolveAdminMetricsDateRange('30d', new Date('2026-07-09T15:00:00Z'))).toEqual({
      from: '2026-06-10',
      to: '2026-07-09',
      cohortWeeks: 8,
    })
  })

  it('resolves a 7-day window', () => {
    expect(resolveAdminMetricsDateRange('7d', new Date('2026-07-09T12:00:00Z'))).toEqual({
      from: '2026-07-03',
      to: '2026-07-09',
      cohortWeeks: 4,
    })
  })
})

describe('computeRollingActiveUsers', () => {
  it('builds a 7-day rolling sum from daily DAU', () => {
    const input = [
      { date: '2026-07-01', dau: 1 },
      { date: '2026-07-02', dau: 2 },
      { date: '2026-07-03', dau: 3 },
    ]

    expect(computeRollingActiveUsers(input, 7)).toEqual([
      { date: '2026-07-01', value: 1 },
      { date: '2026-07-02', value: 3 },
      { date: '2026-07-03', value: 6 },
    ])
  })
})

describe('formatCentsToEuros', () => {
  it('formats euro amounts from cents', () => {
    expect(formatCentsToEuros(999)).toBe('9,99 €')
    expect(formatCentsToEuros(1200)).toBe('12 €')
  })
})

describe('funnelStepRate', () => {
  it('computes conversion between funnel steps', () => {
    expect(funnelStepRate(50, 100)).toBe(50)
    expect(funnelStepRate(0, 0)).toBe(0)
  })
})
