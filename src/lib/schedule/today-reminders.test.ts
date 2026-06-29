import { describe, expect, it } from 'vitest'

import type { ScheduledSession } from '@/lib/schedule/expand-occurrences'
import {
  formatTodayReminderMessage,
  getTodayReminders,
} from '@/lib/schedule/today-reminders'

function baseSession(
  overrides: Partial<ScheduledSession> = {},
): ScheduledSession {
  return {
    id: 'session-1',
    title: 'Push',
    workout_template_id: 'template-a',
    workout_template_id_b: null,
    recurrence_type: 'weekly',
    weekdays: [4],
    scheduled_date: null,
    time_local: null,
    start_date: '2026-06-01',
    end_date: null,
    is_active: true,
    workout_template: { id: 'template-a', name: 'Push' },
    workout_template_b: null,
    ...overrides,
  }
}

describe('getTodayReminders', () => {
  it('returns today planned sessions', () => {
    const reminders = getTodayReminders(
      [baseSession()],
      new Date('2026-06-25T12:00:00'),
    )

    expect(reminders).toHaveLength(1)
    expect(reminders[0]?.title).toBe('Push')
  })

  it('returns empty when a workout was already completed today', () => {
    const reminders = getTodayReminders(
      [baseSession()],
      new Date('2026-06-25T12:00:00'),
      [
        {
          started_at: '2026-06-25T08:00:00.000Z',
          ended_at: '2026-06-25T09:00:00.000Z',
        },
      ],
    )

    expect(reminders).toEqual([])
    expect(formatTodayReminderMessage(reminders)).toBeNull()
  })
})
