import { describe, expect, it } from 'vitest'

import { defaultLineEquipment, exerciseInstanceKey } from '@/lib/workout/exercise-instance-key'

describe('exerciseInstanceKey', () => {
  it('sépare barre et haltères pour le même exercise_id', () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    expect(exerciseInstanceKey(id, 'barbell')).not.toBe(
      exerciseInstanceKey(id, 'dumbbell'),
    )
  })
})

describe('defaultLineEquipment', () => {
  it('préfère le défaut catalogue quand présent dans options', () => {
    const equipment = defaultLineEquipment({
      equipment: 'barbell',
      equipment_options: ['barbell', 'dumbbell'],
    })
    expect(equipment).toBe('barbell')
  })
})
