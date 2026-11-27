import { describe, expect, it } from 'vitest'

import type { Exercise } from '@/lib/graphql/operations'
import {
  exerciseFamilyKey,
  exerciseMatchesTextQuery,
  groupExercisesByFamily,
  stripEquipmentSuffix,
} from '@/lib/workout/exercise-equipment-family'

function ex(
  partial: Partial<Exercise> & Pick<Exercise, 'id' | 'name'>,
): Exercise {
  return {
    muscle_group: 'chest',
    equipment: 'dumbbell',
    is_public: true,
    name_fr: null,
    ...partial,
  }
}

describe('stripEquipmentSuffix', () => {
  it('strips EN and FR equipment suffixes', () => {
    expect(stripEquipmentSuffix('Bench Press (Dumbbell)')).toBe('Bench Press')
    expect(stripEquipmentSuffix('Développé couché (Haltères)')).toBe(
      'Développé couché',
    )
    expect(stripEquipmentSuffix('Curl (Barre)')).toBe('Curl')
    expect(stripEquipmentSuffix('Row (Cable)')).toBe('Row')
    expect(stripEquipmentSuffix('Pulldown (Poulie)')).toBe('Pulldown')
  })
})

describe('groupExercisesByFamily', () => {
  it('groups EN/FR suffix variants of the same base name', () => {
    const groups = groupExercisesByFamily([
      ex({
        id: '1',
        name: 'Bench Press (Dumbbell)',
        name_fr: 'Développé couché (Haltères)',
        equipment: 'dumbbell',
      }),
      ex({
        id: '2',
        name: 'Bench Press (Barbell)',
        name_fr: 'Développé couché (Barre)',
        equipment: 'barbell',
      }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.variants).toHaveLength(2)
    expect(groups[0]?.baseLabel).toBe('Développé couché')
  })

  it('groups Curl dumbbell/barbell/cable into one family sorted by FR equipment', () => {
    const groups = groupExercisesByFamily([
      ex({ id: 'c', name: 'Curl (Cable)', equipment: 'cable' }),
      ex({ id: 'd', name: 'Curl (Dumbbell)', equipment: 'dumbbell' }),
      ex({ id: 'b', name: 'Curl (Barbell)', equipment: 'barbell' }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.variants.map((v) => v.id)).toEqual(['b', 'd', 'c'])
  })

  it('does not merge personal and public with the same base name', () => {
    const groups = groupExercisesByFamily([
      ex({ id: 'pub', name: 'Curl (Dumbbell)', is_public: true }),
      ex({ id: 'priv', name: 'Curl (Dumbbell)', is_public: false }),
    ])

    expect(groups).toHaveLength(2)
    expect(exerciseFamilyKey(ex({ id: 'pub', name: 'Curl (Dumbbell)', is_public: true }))).not.toBe(
      exerciseFamilyKey(ex({ id: 'priv', name: 'Curl (Dumbbell)', is_public: false })),
    )
  })
})

describe('exerciseMatchesTextQuery FR equipment', () => {
  it('matches bodyweight via « poids du corps »', () => {
    expect(
      exerciseMatchesTextQuery(
        ex({ id: 'bw', name: 'Push Up', equipment: 'bodyweight' }),
        'poids du corps',
      ),
    ).toBe(true)
    expect(
      exerciseMatchesTextQuery(
        ex({ id: 'db', name: 'Bench Press (Dumbbell)', equipment: 'dumbbell' }),
        'poids du corps',
      ),
    ).toBe(false)
  })

  it('matches dumbbell via « haltères »', () => {
    expect(
      exerciseMatchesTextQuery(
        ex({ id: 'db', name: 'Curl (Dumbbell)', equipment: 'dumbbell' }),
        'haltères',
      ),
    ).toBe(true)
  })
})
