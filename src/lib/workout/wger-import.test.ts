import { describe, expect, it } from 'vitest'

import { planManualWgerLinks } from '../../../functions/_exercise/import-wger.ts'
import {
  buildCanonicalExerciseName,
  mapWgerEquipment,
  mapWgerExercise,
  mapWgerMuscleGroup,
} from '../../../functions/_exercise/wger-map.ts'

describe('planManualWgerLinks', () => {
  it('links only the first catalog exercise per wger id', () => {
    const planned = planManualWgerLinks(
      {
        'Pull Up': 12,
        'Chin Up': 12,
      },
      [
        { id: 'a', name: 'Pull Up', wger_exercise_id: null },
        { id: 'b', name: 'Chin Up', wger_exercise_id: null },
      ],
    )

    expect(planned).toEqual([{ exerciseId: 'a', name: 'Pull Up', wgerId: 12 }])
  })

  it('skips wger ids already stored on another exercise', () => {
    const planned = planManualWgerLinks(
      { 'Chin Up': 12 },
      [
        { id: 'a', name: 'Pull Up', wger_exercise_id: 12 },
        { id: 'b', name: 'Chin Up', wger_exercise_id: null },
      ],
    )

    expect(planned).toEqual([])
  })
})

describe('mapWgerMuscleGroup', () => {
  it('maps wger legs category and quads muscle', () => {
    expect(
      mapWgerMuscleGroup({
        id: 615,
        nameEn: 'Squats',
        nameFr: 'Accroupi',
        descriptionEn: '',
        descriptionFr: '',
        categoryName: 'Legs',
        muscles: [{ name: 'Quadriceps femoris', name_en: 'Quads' }],
        musclesSecondary: [],
        equipment: [{ name: 'Barbell' }],
      }),
    ).toBe('legs')
  })

  it('maps triceps from arms category when name suggests triceps', () => {
    expect(
      mapWgerMuscleGroup({
        id: 172,
        nameEn: 'Triceps Pushdown',
        nameFr: null,
        descriptionEn: '',
        descriptionFr: '',
        categoryName: 'Arms',
        muscles: [{ name: 'Triceps brachii', name_en: 'Triceps' }],
        musclesSecondary: [],
        equipment: [{ name: 'Dumbbell' }],
      }),
    ).toBe('triceps')
  })
})

describe('mapWgerEquipment', () => {
  it('maps barbell equipment', () => {
    expect(
      mapWgerEquipment({
        id: 615,
        nameEn: 'Squats',
        nameFr: null,
        descriptionEn: '',
        descriptionFr: '',
        categoryName: 'Legs',
        muscles: [],
        musclesSecondary: [],
        equipment: [{ name: 'Barbell' }],
      }),
    ).toBe('barbell')
  })

  it('infers cable from exercise name when wger equipment is empty', () => {
    expect(
      mapWgerEquipment({
        id: 132,
        nameEn: 'Lat Pulldown',
        nameFr: null,
        descriptionEn: '',
        descriptionFr: '',
        categoryName: 'Back',
        muscles: [],
        musclesSecondary: [],
        equipment: [],
      }),
    ).toBe('cable')
  })
})

describe('buildCanonicalExerciseName', () => {
  it('appends equipment suffix when missing', () => {
    expect(buildCanonicalExerciseName('Squats', 'barbell')).toBe('Squats (Barbell)')
  })

  it('keeps names that already include equipment', () => {
    expect(buildCanonicalExerciseName('Bench Press (Barbell)', 'barbell')).toBe(
      'Bench Press (Barbell)',
    )
  })
})

describe('mapWgerExercise', () => {
  it('builds a catalog-ready exercise row', () => {
    expect(
      mapWgerExercise({
        id: 615,
        nameEn: 'Squats',
        nameFr: 'Accroupi',
        descriptionEn: 'English description',
        descriptionFr: 'Description française',
        categoryName: 'Legs',
        muscles: [{ name: 'Quadriceps femoris', name_en: 'Quads' }],
        musclesSecondary: [],
        equipment: [{ name: 'Barbell' }],
      }),
    ).toEqual({
      wger_exercise_id: 615,
      name: 'Squats (Barbell)',
      muscle_group: 'legs',
      equipment: 'barbell',
      tracking_mode: 'auto',
      description_fr: 'Description française',
      description_en: 'English description',
    })
  })
})
