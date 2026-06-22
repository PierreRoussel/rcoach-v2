import { describe, expect, it } from 'vitest'

import { formatRelativeScheduleDate } from '@/lib/schedule/format-relative-schedule-date'

const now = new Date('2026-06-22T10:00:00')

describe('formatRelativeScheduleDate', () => {
  it('labels today, tomorrow, and upcoming days in French', () => {
    expect(formatRelativeScheduleDate('2026-06-22', now)).toBe("Aujourd'hui")
    expect(formatRelativeScheduleDate('2026-06-23', now)).toBe('Demain')
    expect(formatRelativeScheduleDate('2026-06-25', now)).toBe('Dans 3 jours')
  })

  it('falls back to a short absolute date after one week', () => {
    expect(formatRelativeScheduleDate('2026-07-01', now)).toBe('1 juil.')
  })
})
