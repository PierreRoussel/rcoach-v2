import { describe, expect, it } from 'vitest'

import type { ScheduledSession } from '@/lib/schedule/expand-occurrences'
import {
  getMissedOccurrencesForDay,
  getYesterdayMissedOccurrences,
  hadCompletedWorkoutOnDay,
} from '@/lib/schedule/missed-occurrences'

const now = new Date('2026-06-25T10:00:00')

function weeklySession(overrides?: Partial<ScheduledSession>): ScheduledSession {
  return {
    id: 'session-1',
    title: 'Push',
    workout_template_id: 'tpl-1',
    workout_template_id_b: null,
    recurrence_type: 'weekly',
    weekdays: [3],
    scheduled_date: null,
    time_local: '18:00',
    start_date: '2026-01-01',
    end_date: null,
    is_active: true,
    workout_template: { id: 'tpl-1', name: 'Push' },
    workout_template_b: null,
    ...overrides,
  }
}

describe('hadCompletedWorkoutOnDay', () => {
  it('returns true when a workout ended on that day', () => {
    expect(
      hadCompletedWorkoutOnDay(
        [{ started_at: '2026-06-24T08:00:00.000Z', ended_at: '2026-06-24T09:00:00.000Z' }],
        new Date('2026-06-24T12:00:00'),
      ),
    ).toBe(true)
  })

  it('returns false when workout is still in progress', () => {
    expect(
      hadCompletedWorkoutOnDay(
        [{ started_at: '2026-06-24T08:00:00.000Z', ended_at: null }],
        new Date('2026-06-24T12:00:00'),
      ),
    ).toBe(false)
  })
})

describe('getYesterdayMissedOccurrences', () => {
  it('returns planned occurrences from yesterday when no workout was completed', () => {
    const sessions = [weeklySession({ weekdays: [3] })]

    const missed = getYesterdayMissedOccurrences(sessions, [], now)

    expect(missed).toHaveLength(1)
    expect(missed[0]?.date).toBe('2026-06-24')
    expect(missed[0]?.title).toBe('Push')
  })

  it('returns empty when the planned template was completed yesterday', () => {
    const sessions = [weeklySession({ weekdays: [3] })]

    const missed = getYesterdayMissedOccurrences(
      sessions,
      [
        {
          started_at: '2026-06-24T07:00:00.000Z',
          ended_at: '2026-06-24T08:00:00.000Z',
          workout_template_id: 'tpl-1',
        },
      ],
      now,
    )

    expect(missed).toHaveLength(0)
  })

  it('still returns missed when another template was completed yesterday', () => {
    const sessions = [weeklySession({ weekdays: [3] })]

    const missed = getYesterdayMissedOccurrences(
      sessions,
      [
        {
          started_at: '2026-06-24T07:00:00.000Z',
          ended_at: '2026-06-24T08:00:00.000Z',
          workout_template_id: 'tpl-b',
        },
      ],
      now,
    )

    expect(missed).toHaveLength(1)
    expect(missed[0]?.workoutTemplateId).toBe('tpl-1')
  })

  it('returns empty when there was no planned session yesterday', () => {
    const sessions = [weeklySession({ weekdays: [4] })]

    expect(getYesterdayMissedOccurrences(sessions, [], now)).toHaveLength(0)
  })
})

describe('getMissedOccurrencesForDay', () => {
  it('does not return occurrences for today or future days', () => {
    const sessions = [weeklySession({ weekdays: [3] })]

    expect(
      getMissedOccurrencesForDay(sessions, [], new Date('2026-06-25T12:00:00'), now),
    ).toHaveLength(0)
  })
})
