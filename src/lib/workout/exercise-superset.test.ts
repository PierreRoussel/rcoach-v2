import { describe, expect, it } from 'vitest'

import {
  addExerciseToSuperset,
  applySupersetMembership,
  cleanupSupersetAfterRemoval,
  compactSupersetBlocks,
  getDefaultSupersetPartnerIndices,
  getSupersetMemberIndices,
  removeExerciseFromSuperset,
} from '@/lib/workout/exercise-superset'

type Exercise = {
  id: string
  supersetId: number | null
}

function makeExercise(id: string, supersetId: number | null = null): Exercise {
  return { id, supersetId }
}

describe('exercise-superset', () => {
  it('adds a third non-adjacent exercise into a contiguous superset block', () => {
    const exercises = [
      makeExercise('bench', 1),
      makeExercise('row', 1),
      makeExercise('curl', null),
      makeExercise('dips', null),
    ]

    const next = addExerciseToSuperset(exercises, 3, 1)

    expect(next.map((exercise) => exercise.id)).toEqual([
      'bench',
      'row',
      'dips',
      'curl',
    ])
    expect(next.map((exercise) => exercise.supersetId)).toEqual([1, 1, 1, null])
  })

  it('adds a fourth exercise to an existing superset', () => {
    const exercises = [
      makeExercise('a', 1),
      makeExercise('b', 1),
      makeExercise('c', 1),
      makeExercise('d', null),
    ]

    const next = addExerciseToSuperset(exercises, 3, 2)

    expect(next.map((exercise) => exercise.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(next.every((exercise) => exercise.supersetId === 1)).toBe(true)
  })

  it('keeps multiple supersets separate', () => {
    const exercises = [
      makeExercise('a', 1),
      makeExercise('b', 1),
      makeExercise('c', null),
      makeExercise('d', 2),
      makeExercise('e', 2),
    ]

    const next = addExerciseToSuperset(exercises, 2, 1)

    expect(next.map((exercise) => exercise.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(next.map((exercise) => exercise.supersetId)).toEqual([1, 1, 1, 2, 2])
  })

  it('removes the middle exercise from a three-exercise superset', () => {
    const exercises = [
      makeExercise('a', 1),
      makeExercise('b', 1),
      makeExercise('c', 1),
    ]

    const next = removeExerciseFromSuperset(exercises, 1)

    expect(next.map((exercise) => exercise.supersetId)).toEqual([1, null, 1])
  })

  it('dissolves a superset when only one member remains', () => {
    const exercises = [makeExercise('a', 1), makeExercise('b', 1)]

    const next = removeExerciseFromSuperset(exercises, 1)

    expect(next.map((exercise) => exercise.supersetId)).toEqual([null, null])
  })

  it('cleans up orphaned supersets after exercise removal', () => {
    const exercises = [makeExercise('a', 1)]

    const next = cleanupSupersetAfterRemoval(exercises)

    expect(next[0]?.supersetId).toBeNull()
  })

  it('compacts split superset members into one contiguous block', () => {
    const exercises = [
      makeExercise('a', 1),
      makeExercise('x', null),
      makeExercise('b', 1),
    ]

    const next = compactSupersetBlocks(exercises)

    expect(next.map((exercise) => exercise.id)).toEqual(['a', 'b', 'x'])
    expect(getSupersetMemberIndices(next, 1)).toEqual([0, 1])
  })

  it('compacts multiple supersets independently', () => {
    const exercises = [
      makeExercise('a', 1),
      makeExercise('x', null),
      makeExercise('b', 1),
      makeExercise('c', 2),
      makeExercise('y', null),
      makeExercise('d', 2),
    ]

    const next = compactSupersetBlocks(exercises)

    expect(next.map((exercise) => exercise.id)).toEqual([
      'a',
      'b',
      'x',
      'c',
      'd',
      'y',
    ])
    expect(getSupersetMemberIndices(next, 1)).toEqual([0, 1])
    expect(getSupersetMemberIndices(next, 2)).toEqual([3, 4])
  })

  it('returns default partner indices from the anchor superset', () => {
    const exercises = [
      makeExercise('a', 1),
      makeExercise('b', 1),
      makeExercise('c', null),
    ]

    expect(getDefaultSupersetPartnerIndices(exercises, 0)).toEqual([1])
    expect(getDefaultSupersetPartnerIndices(exercises, 2)).toEqual([])
  })

  it('applies multi-select superset membership from a drawer selection', () => {
    const exercises = [
      makeExercise('a', 1),
      makeExercise('b', 1),
      makeExercise('c', null),
      makeExercise('d', null),
    ]

    const next = applySupersetMembership(exercises, 0, [2])

    expect(next.map((exercise) => exercise.supersetId)).toEqual([1, 1, null, null])
    expect(next.map((exercise) => exercise.id)).toEqual(['a', 'c', 'b', 'd'])
  })

  it('dissolves the superset when no partner remains selected', () => {
    const exercises = [makeExercise('a', 1), makeExercise('b', 1)]

    const next = applySupersetMembership(exercises, 0, [])

    expect(next.every((exercise) => exercise.supersetId == null)).toBe(true)
  })
})
