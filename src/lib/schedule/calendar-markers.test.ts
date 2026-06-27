import { describe, expect, it } from 'vitest'

import {
  calendarDayTimestamp,
  canStartPlannedOccurrence,
  isPastCalendarDay,
} from '@/lib/schedule/calendar-markers'

describe('isPastCalendarDay', () => {
  const now = new Date(2026, 5, 25, 15, 30)

  it('returns true for a day before today', () => {
    expect(isPastCalendarDay(new Date(2026, 5, 24), now)).toBe(true)
  })

  it('returns false for today', () => {
    expect(isPastCalendarDay(new Date(2026, 5, 25, 8), now)).toBe(false)
  })

  it('returns false for a future day', () => {
    expect(isPastCalendarDay(new Date(2026, 5, 26), now)).toBe(false)
  })
})

describe('canStartPlannedOccurrence', () => {
  const now = new Date(2026, 5, 25, 15, 30)

  it('returns false for a past day', () => {
    expect(
      canStartPlannedOccurrence(new Date(2026, 5, 24), undefined, now),
    ).toBe(false)
  })

  it('returns false when a workout is already recorded', () => {
    expect(
      canStartPlannedOccurrence(
        new Date(2026, 5, 25),
        {
          workouts: [
            {
              id: 'w1',
              title: 'Full Body',
              started_at: '2026-06-25T10:00:00.000Z',
              ended_at: '2026-06-25T11:00:00.000Z',
            },
          ],
        },
        now,
      ),
    ).toBe(false)
  })

  it('returns true for today without a recorded workout', () => {
    expect(canStartPlannedOccurrence(new Date(2026, 5, 25), undefined, now)).toBe(
      true,
    )
  })
})

describe('calendarDayTimestamp', () => {
  it('sets local noon on the given day', () => {
    const timestamp = calendarDayTimestamp(new Date(2026, 5, 10, 23, 45))

    expect(timestamp.getFullYear()).toBe(2026)
    expect(timestamp.getMonth()).toBe(5)
    expect(timestamp.getDate()).toBe(10)
    expect(timestamp.getHours()).toBe(12)
    expect(timestamp.getMinutes()).toBe(0)
  })
})
