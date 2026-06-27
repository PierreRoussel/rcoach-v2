import { describe, expect, it } from 'vitest'

import {
  getDefaultFreeWorkoutTitle,
  isLegacyFreeWorkoutTitle,
} from '@/lib/workout/default-free-workout-title'

describe('getDefaultFreeWorkoutTitle', () => {
  it('uses morning title before noon', () => {
    expect(getDefaultFreeWorkoutTitle(new Date('2026-06-25T09:30:00'))).toBe(
      'Séance du matin ☀️',
    )
  })

  it('uses afternoon title in the afternoon', () => {
    expect(getDefaultFreeWorkoutTitle(new Date('2026-06-25T14:00:00'))).toBe(
      "Séance de l'après-midi 🌤️",
    )
  })

  it('uses evening title at night', () => {
    expect(getDefaultFreeWorkoutTitle(new Date('2026-06-25T20:00:00'))).toBe(
      'Séance du soir 🌙',
    )
  })
})

describe('isLegacyFreeWorkoutTitle', () => {
  it('detects the old static free session label', () => {
    expect(isLegacyFreeWorkoutTitle('Séance libre')).toBe(true)
    expect(isLegacyFreeWorkoutTitle('Push day')).toBe(false)
  })
})
