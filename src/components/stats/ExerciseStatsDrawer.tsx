import { useEffect, useState } from 'react'

import { ExerciseStatsPanel } from '@/components/stats/ExerciseStatsPanel'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { StatsPeriod } from '@/lib/stats/exercise-progression'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'

export type ExerciseStatsDrawerTarget = {
  exerciseId: string
  exerciseName: string
  muscleGroup?: string | null
  equipment?: string | null
}

type ExerciseStatsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: ExerciseStatsDrawerTarget | null
}

export function ExerciseStatsDrawer({
  open,
  onOpenChange,
  exercise,
}: ExerciseStatsDrawerProps) {
  const [period, setPeriod] = useState<StatsPeriod>('3m')

  useEffect(() => {
    if (open) {
      setPeriod('3m')
    }
  }, [open, exercise?.exerciseId])

  const muscleLabel = exercise?.muscleGroup
    ? MUSCLE_GROUP_LABELS[normalizeMuscleGroup(exercise.muscleGroup)]
    : null
  const displayExerciseName = useExerciseDisplayName(exercise?.exerciseName)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-2xl px-4 pb-8"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-display font-black">
            {displayExerciseName || 'Statistiques'}
          </SheetTitle>
          <SheetDescription>
            {[muscleLabel, exercise?.equipment].filter(Boolean).join(' · ') ||
              "Progression et historique de l'exercice"}
          </SheetDescription>
        </SheetHeader>

        {exercise ? (
          <div className="mt-4">
            <ExerciseStatsPanel
              exerciseId={exercise.exerciseId}
              fallbackName={exercise.exerciseName}
              fallbackMuscleGroup={exercise.muscleGroup}
              fallbackEquipment={exercise.equipment}
              period={period}
              onPeriodChange={setPeriod}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
