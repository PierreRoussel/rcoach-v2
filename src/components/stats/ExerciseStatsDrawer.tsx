import { useEffect, useState } from 'react'

import { ExerciseStatsPanel } from '@/components/stats/ExerciseStatsPanel'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { StatsPeriod } from '@/lib/stats/exercise-progression'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'

export type ExerciseStatsDrawerTarget = {
  exerciseId: string
  exerciseName: string
  exerciseNameFr?: string | null
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
  const displayExerciseName = useExerciseDisplayName(
    exercise?.exerciseName,
    exercise?.exerciseNameFr,
    exercise?.exerciseId,
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl px-0">
        <DrawerHeader className="shrink-0 px-4 pb-2 text-left">
          <DrawerTitle className="font-display font-black">
            {displayExerciseName || 'Statistiques'}
          </DrawerTitle>
          <DrawerDescription>
            {[muscleLabel, exercise?.equipment].filter(Boolean).join(' · ') ||
              "Progression et historique de l'exercice"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {exercise ? (
            <ExerciseStatsPanel
              exerciseId={exercise.exerciseId}
              fallbackName={displayExerciseName || exercise.exerciseName}
              fallbackMuscleGroup={exercise.muscleGroup}
              fallbackEquipment={exercise.equipment}
              period={period}
              onPeriodChange={setPeriod}
              layout="drawer"
              showSummaryLine={false}
            />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
