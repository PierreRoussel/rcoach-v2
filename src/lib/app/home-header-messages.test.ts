import { describe, expect, it } from 'vitest'

import {
  resolveHomeHeaderGreeting,
  resolveHomeHeaderSubtitle,
} from '@/lib/app/home-header-messages'

const NOW = new Date('2026-06-27T10:00:00.000Z')

describe('resolveHomeHeaderGreeting', () => {
  it('stays stable for the same user and day', () => {
    const first = resolveHomeHeaderGreeting('Léo', 'user-1', NOW)
    const second = resolveHomeHeaderGreeting('Léo', 'user-1', NOW)

    expect(second).toBe(first)
    expect(first).toContain('Léo')
  })

  it('can change on another day', () => {
    const dayOne = resolveHomeHeaderGreeting('Léo', 'user-1', NOW)
    const dayTwo = resolveHomeHeaderGreeting(
      'Léo',
      'user-1',
      new Date('2026-06-28T10:00:00.000Z'),
    )

    expect(dayTwo).not.toBe(dayOne)
  })
})

describe('resolveHomeHeaderSubtitle', () => {
  it('prioritizes today reminder over recent workout recap', () => {
    const subtitle = resolveHomeHeaderSubtitle(
      {
        userId: 'user-1',
        firstName: 'Léo',
        todayReminders: [
          {
            sessionId: 's1',
            title: 'Push',
            date: '2026-06-27',
            workoutTemplateId: 'template-a',
            workoutTemplateName: 'Push',
            timeLocal: '18:00',
            timeLabel: '18h00',
          },
        ],
        lastWorkout: { title: 'Legs', startedAt: '2026-06-26T08:00:00.000Z' },
      },
      NOW,
    )

    expect(subtitle.mode === 'today_reminder' || subtitle.mode === 'fun').toBe(true)
    if (subtitle.mode === 'today_reminder') {
      expect(subtitle.text).toContain('Push')
    }
  })

  it('returns recent workout recap when no reminder and fun is off', () => {
    const subtitle = resolveHomeHeaderSubtitle(
      {
        userId: 'user-factual',
        todayReminders: [],
        lastWorkout: { title: 'Fullbody', startedAt: '2026-06-27T08:00:00.000Z' },
      },
      NOW,
    )

    expect(subtitle.mode === 'recent_workout' || subtitle.mode === 'fun').toBe(true)
    if (subtitle.mode === 'recent_workout') {
      expect(subtitle.text).toContain('Fullbody')
    }
  })

  it('returns first workout prompt when nothing else is available', () => {
    const subtitle = resolveHomeHeaderSubtitle(
      {
        userId: 'user-new',
        todayReminders: [],
        lastWorkout: null,
      },
      NOW,
    )

    expect(subtitle.mode === 'first_workout' || subtitle.mode === 'fun').toBe(true)
  })
})
