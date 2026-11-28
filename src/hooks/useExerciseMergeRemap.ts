import { useEffect, useRef } from 'react'

import { useAllExercises, useExerciseMergeMap } from '@/hooks/useExercises'
import { db } from '@/lib/db/dexie'
import {
  buildExerciseMergeMap,
  remapActiveExerciseDraft,
} from '@/lib/workout/exercise-merge-map'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export function useExerciseMergeRemap() {
  const { data: exercises = [] } = useAllExercises()
  const { data: mergeRows = [] } = useExerciseMergeMap()
  const hydrate = useActiveWorkoutStore((state) => state.hydrate)
  const appliedRef = useRef(false)

  useEffect(() => {
    if (appliedRef.current || exercises.length === 0 || mergeRows.length === 0) {
      return
    }

    const mergeMap = buildExerciseMergeMap(mergeRows)
    const catalogById = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    void (async () => {
      const draftRow = await db.activeDraft.get('current')
      if (!draftRow?.exercises?.length) {
        return
      }

      const remapped = draftRow.exercises.map((entry) =>
        remapActiveExerciseDraft(entry, catalogById, mergeMap),
      )
      const changed = remapped.some(
        (entry, index) => entry.exerciseId !== draftRow.exercises[index]?.exerciseId,
      )

      if (!changed) {
        return
      }

      appliedRef.current = true
      await db.activeDraft.put({ ...draftRow, exercises: remapped })
      await hydrate()
    })()
  }, [exercises, mergeRows, hydrate])
}
