import { describe, expect, it } from 'vitest'

import {
  canStartPlannedOccurrence,
  getMarkerKind,
  buildCalendarMarkers,
  calendarDayTimestamp,
  isPastCalendarDay,
} from '@/lib/schedule/calendar-markers'
import type { CalendarWorkoutSummary } from '@/lib/graphql/operations'
import type { ScheduledSession } from '@/lib/schedule/expand-occurrences'

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

  it('returns false when the planned template was already completed', () => {
    expect(
      canStartPlannedOccurrence(
        new Date(2026, 5, 25),
        {
          workouts: [
            {
              id: 'w1',
              title: 'Full Body A',
              started_at: '2026-06-25T10:00:00.000Z',
              ended_at: '2026-06-25T11:00:00.000Z',
              workout_template_id: 'tpl-a',
            },
          ],
          planned: [
            {
              date: '2026-06-25',
              sessionId: 's1',
              title: 'Full Body A',
              workoutTemplateId: 'tpl-a',
              workoutTemplateName: 'Full Body A',
              timeLocal: null,
            },
          ],
        },
        {
          date: '2026-06-25',
          sessionId: 's1',
          title: 'Full Body A',
          workoutTemplateId: 'tpl-a',
          workoutTemplateName: 'Full Body A',
          timeLocal: null,
        },
        now,
      ),
    ).toBe(false)
  })

  it('returns true when another template was completed instead', () => {
    expect(
      canStartPlannedOccurrence(
        new Date(2026, 5, 25),
        {
          workouts: [
            {
              id: 'w1',
              title: 'Full Body B',
              started_at: '2026-06-25T10:00:00.000Z',
              ended_at: '2026-06-25T11:00:00.000Z',
              workout_template_id: 'tpl-b',
            },
          ],
          planned: [
            {
              date: '2026-06-25',
              sessionId: 's1',
              title: 'Full Body A',
              workoutTemplateId: 'tpl-a',
              workoutTemplateName: 'Full Body A',
              timeLocal: null,
            },
          ],
        },
        {
          date: '2026-06-25',
          sessionId: 's1',
          title: 'Full Body A',
          workoutTemplateId: 'tpl-a',
          workoutTemplateName: 'Full Body A',
          timeLocal: null,
        },
        now,
      ),
    ).toBe(true)
  })

  it('returns true for today without a recorded workout', () => {
    expect(canStartPlannedOccurrence(new Date(2026, 5, 25), undefined, undefined, now)).toBe(
      true,
    )
  })
})

describe('getMarkerKind', () => {
  const now = new Date(2026, 5, 25, 12, 0)
  const rangeStart = new Date(2026, 5, 1)
  const rangeEnd = new Date(2026, 5, 30)

  it('returns done when a planned session was completed that day', () => {
    const workouts: CalendarWorkoutSummary[] = [
      {
        id: 'w1',
        title: 'Full Body A',
        started_at: '2026-06-20T10:00:00.000Z',
        ended_at: '2026-06-20T11:00:00.000Z',
        workout_template_id: 'tpl-a',
      },
    ]
    const sessions: ScheduledSession[] = [
      {
        id: 's1',
        title: 'Full Body A',
        workout_template_id: 'tpl-a',
        recurrence_type: 'once',
        weekdays: null,
        scheduled_date: '2026-06-20',
        time_local: null,
        start_date: '2026-06-20',
        end_date: null,
        is_active: true,
      },
    ]

    const markers = buildCalendarMarkers(
      workouts,
      sessions,
      rangeStart,
      rangeEnd,
      now,
    )
    const marker = markers.get('2026-06-20')

    expect(getMarkerKind(marker)).toBe('done')
    expect(marker?.kinds.has('missed')).toBe(false)
    expect(marker?.kinds.has('planned')).toBe(false)
  })

  it('returns missed when another template was completed instead', () => {
    const workouts: CalendarWorkoutSummary[] = [
      {
        id: 'w1',
        title: 'Full Body B',
        started_at: '2026-06-20T10:00:00.000Z',
        ended_at: '2026-06-20T11:00:00.000Z',
        workout_template_id: 'tpl-b',
      },
    ]
    const sessions: ScheduledSession[] = [
      {
        id: 's1',
        title: 'Full Body A',
        workout_template_id: 'tpl-a',
        recurrence_type: 'once',
        weekdays: null,
        scheduled_date: '2026-06-20',
        time_local: null,
        start_date: '2026-06-20',
        end_date: null,
        is_active: true,
      },
    ]

    const markers = buildCalendarMarkers(
      workouts,
      sessions,
      rangeStart,
      rangeEnd,
      now,
    )
    const marker = markers.get('2026-06-20')

    expect(getMarkerKind(marker)).toBe('missed')
    expect(marker?.kinds.has('done')).toBe(false)
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
