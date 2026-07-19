import { describe, expect, it } from 'vitest'

import {
  formatRpeRepsInReserveHint,
  getRpeRepsInReserve,
} from '@/lib/workout/rpe-values'

describe('rpe reps in reserve hints', () => {
  it('maps RPE to remaining reps', () => {
    expect(getRpeRepsInReserve(10)).toBe(0)
    expect(getRpeRepsInReserve(9.5)).toBe(0.5)
    expect(getRpeRepsInReserve(8)).toBe(2)
    expect(getRpeRepsInReserve(6)).toBe(4)
  })

  it('formats french hints for the drawer', () => {
    expect(formatRpeRepsInReserveHint(10)).toBe('Échec — 0 répétition restante')
    expect(formatRpeRepsInReserveHint(9.5)).toBe('Moins d’1 répétition restante')
    expect(formatRpeRepsInReserveHint(9)).toBe('1 répétition restante')
    expect(formatRpeRepsInReserveHint(8)).toBe('2 répétitions restantes')
    expect(formatRpeRepsInReserveHint(8.5)).toBe('1.5 répétitions restantes')
  })
})
