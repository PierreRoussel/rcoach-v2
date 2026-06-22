import type { ActiveExerciseEntry, ActiveSet } from '@/lib/workout/active-store'

import { SetOptionsDrawer } from '@/components/workout/SetOptionsDrawer'

type ActiveSetOptionsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: ActiveExerciseEntry | null
  exerciseIndex: number | null
  selectedSetIndex: number | null
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void
  onReorderSets: (exerciseIndex: number, fromIndex: number, toIndex: number) => void
  onUpdateSetType: (
    exerciseIndex: number,
    setIndex: number,
    setType: ActiveSet['setType'],
  ) => void
}

export function ActiveSetOptionsDrawer({
  open,
  onOpenChange,
  exercise,
  exerciseIndex,
  selectedSetIndex,
  onDeleteSet,
  onReorderSets,
  onUpdateSetType,
}: ActiveSetOptionsDrawerProps) {
  return (
    <SetOptionsDrawer
      open={open}
      onOpenChange={onOpenChange}
      exerciseName={exercise?.exerciseName ?? null}
      sets={exercise?.sets ?? []}
      selectedSetIndex={selectedSetIndex}
      onDeleteSet={(setIndex) => {
        if (exerciseIndex != null) {
          onDeleteSet(exerciseIndex, setIndex)
        }
      }}
      onReorderSets={(fromIndex, toIndex) => {
        if (exerciseIndex != null) {
          onReorderSets(exerciseIndex, fromIndex, toIndex)
        }
      }}
      onUpdateSetType={(setIndex, setType) => {
        if (exerciseIndex != null) {
          onUpdateSetType(exerciseIndex, setIndex, setType)
        }
      }}
    />
  )
}
