import { describe, expect, it } from 'vitest'

import {
  buildFrenchExerciseTranslation,
  extractEnglishEquipmentSuffix,
  isExerciseAnglicism,
  resolveExerciseNameFr,
} from '../../../functions/_exercise/exercise-translation-build.ts'

describe('resolveExerciseNameFr', () => {
  it('builds french label from wger', () => {
    expect(
      resolveExerciseNameFr({
        name: 'Squats (Barbell)',
        wgerNameFr: 'Accroupi',
      }),
    ).toBe('Accroupi (Barre)')
  })
})

describe('buildFrenchExerciseTranslation', () => {
  it('maps equipment suffix to french labels', () => {
    expect(
      buildFrenchExerciseTranslation({
        canonicalName: 'Squats (Barbell)',
        wgerNameFr: 'Accroupi',
      }),
    ).toBe('Accroupi (Barre)')
  })

  it('keeps anglicisms as null', () => {
    expect(
      buildFrenchExerciseTranslation({
        canonicalName: 'Hip Thrust (Barbell)',
        wgerNameFr: 'Hip thrust',
      }),
    ).toBeNull()
  })

  it('returns french base without suffix when canonical has none', () => {
    expect(
      buildFrenchExerciseTranslation({
        canonicalName: 'Pull Up',
        wgerNameFr: 'Traction',
      }),
    ).toBe('Traction')
  })
})

describe('extractEnglishEquipmentSuffix', () => {
  it('reads the trailing equipment suffix', () => {
    expect(extractEnglishEquipmentSuffix('Leg Presses (wide) (Machine)')).toBe('Machine')
  })
})

describe('isExerciseAnglicism', () => {
  it('detects seed anglicisms', () => {
    expect(isExerciseAnglicism('Face Pull (Cable)')).toBe(true)
    expect(isExerciseAnglicism('Bench Press (Barbell)')).toBe(false)
  })
})
