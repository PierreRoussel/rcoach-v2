import { useMemo } from 'react'

import { HumanBodyHeatmap } from '@/components/stats/BodyHeatmap'
import { getExerciseBodyIntensities } from '@/lib/stats/exercise-body-intensities'
import { cn } from '@/lib/utils'

type ExerciseBodyMapProps = {
  muscleGroup?: string | null
  className?: string
}

export function ExerciseBodyMap({ muscleGroup, className }: ExerciseBodyMapProps) {
  const intensities = useMemo(
    () => getExerciseBodyIntensities(muscleGroup),
    [muscleGroup],
  )

  return (
    <HumanBodyHeatmap
      intensities={intensities}
      compact
      showLegend={false}
      legendVariant="exercise"
      className={cn(className)}
    />
  )
}
