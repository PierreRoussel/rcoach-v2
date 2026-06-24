import { describe, expect, it } from 'vitest'

import {
  countSessionOccurrencesUpTo,
  expandSessionOccurrences,
  type ScheduledSession,
} from '@/lib/schedule/expand-occurrences'

function baseSession(
  overrides: Partial<ScheduledSession> = {},
): ScheduledSession {
  return {
    id: 'session-1',
    title: 'Alternance',
    workout_template_id: 'template-a',
    workout_template_id_b: 'template-b',
    recurrence_type: 'aba',
    weekdays: [1, 3, 5],
    scheduled_date: null,
    time_local: null,
    start_date: '2026-06-01',
    end_date: null,
    is_active: true,
    workout_template: { id: 'template-a', name: 'Push' },
    workout_template_b: { id: 'template-b', name: 'Pull' },
    ...overrides,
  }
}

describe('countSessionOccurrencesUpTo', () => {
  it('counts Mon/Wed/Fri occurrences from start_date', () => {
    const session = baseSession()

    expect(
      countSessionOccurrencesUpTo(session, new Date('2026-06-01T12:00:00')),
    ).toBe(1)
    expect(
      countSessionOccurrencesUpTo(session, new Date('2026-06-03T12:00:00')),
    ).toBe(2)
    expect(
      countSessionOccurrencesUpTo(session, new Date('2026-06-05T12:00:00')),
    ).toBe(3)
    expect(
      countSessionOccurrencesUpTo(session, new Date('2026-06-08T12:00:00')),
    ).toBe(4)
  })
})

describe('expandSessionOccurrences aba', () => {
  it('alternates templates as ABAB across odd weekday counts', () => {
    const session = baseSession({ weekdays: [1, 3, 5] })
    const rangeStart = new Date('2026-06-01T12:00:00')
    const rangeEnd = new Date('2026-06-14T12:00:00')

    const occurrences = expandSessionOccurrences(session, rangeStart, rangeEnd)

    expect(occurrences.map((entry) => entry.workoutTemplateId)).toEqual([
      'template-a',
      'template-b',
      'template-a',
      'template-b',
      'template-a',
      'template-b',
    ])
  })

  it('keeps AB alternation with a single weekday', () => {
    const session = baseSession({ weekdays: [1] })
    const occurrences = expandSessionOccurrences(
      session,
      new Date('2026-06-01T12:00:00'),
      new Date('2026-06-22T12:00:00'),
    )

    expect(occurrences.map((entry) => entry.workoutTemplateName)).toEqual([
      'Push',
      'Pull',
      'Push',
      'Pull',
    ])
  })

  it('does not reset the sequence at week boundaries', () => {
    const session = baseSession({ weekdays: [1, 2, 3, 4, 5] })
    const occurrences = expandSessionOccurrences(
      session,
      new Date('2026-06-01T12:00:00'),
      new Date('2026-06-12T12:00:00'),
    )

    const sequence = occurrences.map((entry) =>
      entry.workoutTemplateId === 'template-a' ? 'A' : 'B',
    )

    expect(sequence.join('')).toBe('ABABABABAB')
  })
})
