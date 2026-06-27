import { describe, expect, it } from 'vitest'

import {
  buildTemplateLineupComparison,
  isTemplateLineupComparisonRowChanged,
  snapshotExerciseLineup,
  templateLineupChanged,
} from '@/lib/workout/template-lineup'

describe('templateLineupChanged', () => {
  it('returns false when exercise order and ids match', () => {
    const lineup = snapshotExerciseLineup([
      { exerciseId: 'a', exerciseName: 'Bench Press' },
      { exerciseId: 'b', exerciseName: 'Row' },
    ])

    expect(templateLineupChanged(lineup, [...lineup])).toBe(false)
  })

  it('returns true when an exercise was replaced', () => {
    const before = snapshotExerciseLineup([
      { exerciseId: 'a', exerciseName: 'Bench Press' },
    ])
    const after = snapshotExerciseLineup([
      { exerciseId: 'b', exerciseName: 'Incline Press' },
    ])

    expect(templateLineupChanged(before, after)).toBe(true)
  })

  it('returns true when exercises were reordered', () => {
    const before = snapshotExerciseLineup([
      { exerciseId: 'a', exerciseName: 'A' },
      { exerciseId: 'b', exerciseName: 'B' },
    ])
    const after = snapshotExerciseLineup([
      { exerciseId: 'b', exerciseName: 'B' },
      { exerciseId: 'a', exerciseName: 'A' },
    ])

    expect(templateLineupChanged(before, after)).toBe(true)
  })
})

describe('buildTemplateLineupComparison', () => {
  it('aligns rows side by side with null padding', () => {
    const rows = buildTemplateLineupComparison(
      snapshotExerciseLineup([{ exerciseId: 'a', exerciseName: 'A' }]),
      snapshotExerciseLineup([
        { exerciseId: 'b', exerciseName: 'B' },
        { exerciseId: 'c', exerciseName: 'C' },
      ]),
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]?.before?.exerciseId).toBe('a')
    expect(rows[0]?.after?.exerciseId).toBe('b')
    expect(rows[1]?.before).toBeNull()
    expect(rows[1]?.after?.exerciseId).toBe('c')
  })
})

describe('isTemplateLineupComparisonRowChanged', () => {
  it('marks rows with missing sides as changed', () => {
    expect(
      isTemplateLineupComparisonRowChanged({
        before: { exerciseId: 'a', exerciseName: 'A' },
        after: null,
      }),
    ).toBe(true)
  })

  it('marks rows with different ids as changed', () => {
    expect(
      isTemplateLineupComparisonRowChanged({
        before: { exerciseId: 'a', exerciseName: 'A' },
        after: { exerciseId: 'b', exerciseName: 'B' },
      }),
    ).toBe(true)
  })
})
