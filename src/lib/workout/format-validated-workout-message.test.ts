import { describe, expect, it } from 'vitest'

import { formatValidatedWorkoutMessage } from '@/lib/workout/format-validated-workout-message'

describe('formatValidatedWorkoutMessage', () => {
  const now = new Date('2026-06-25T14:00:00')

  it('formats a workout validated this morning', () => {
    expect(
      formatValidatedWorkoutMessage('Fullbody A', '2026-06-25T09:30:00', now),
    ).toBe('Fullbody A valide ce matin !')
  })

  it('formats a workout validated this afternoon', () => {
    expect(
      formatValidatedWorkoutMessage('Push B', '2026-06-25T15:00:00', now),
    ).toBe('Push B valide cet apres-midi !')
  })

  it('formats a workout validated this evening', () => {
    expect(
      formatValidatedWorkoutMessage('Legs', '2026-06-25T20:00:00', now),
    ).toBe('Legs valide ce soir !')
  })

  it('formats a workout validated yesterday morning', () => {
    expect(
      formatValidatedWorkoutMessage('Pull A', '2026-06-24T08:00:00', now),
    ).toBe('Pull A valide hier matin !')
  })

  it('formats a workout validated two days ago', () => {
    expect(
      formatValidatedWorkoutMessage('Upper', '2026-06-23T10:00:00', now),
    ).toBe('Upper valide avant-hier !')
  })

  it('formats a workout validated several days ago', () => {
    expect(
      formatValidatedWorkoutMessage('Cardio', '2026-06-20T10:00:00', now),
    ).toBe('Cardio valide il y a 5 jours')
  })

  it('falls back to a generic title', () => {
    expect(formatValidatedWorkoutMessage('  ', '2026-06-25T09:00:00', now)).toBe(
      'Seance valide ce matin !',
    )
  })
})
