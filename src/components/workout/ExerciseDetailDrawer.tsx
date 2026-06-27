import { Dumbbell } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

import { ExerciseBodyMap } from '@/components/workout/ExerciseBodyMap'
import { ExerciseCoachingText } from '@/components/workout/ExerciseCoachingText'
import { ExerciseDemoPlayer } from '@/components/workout/ExerciseDemoPlayer'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Pill } from '@/design-system'
import { useExerciseContent } from '@/hooks/useExerciseContent'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'
import {
  buildTemplateCoachingCues,
  resolveExerciseCoaching,
  type ExerciseContentStatus,
} from '@/lib/workout/exercise-coaching'
import { formatEquipmentLabel } from '@/lib/workout/exercise-labels'

export type ExerciseDetailDrawerTarget = Pick<
  ActiveExerciseEntry,
  'exerciseId' | 'exerciseName' | 'muscleGroup' | 'equipment'
>

type ExerciseDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: ExerciseDetailDrawerTarget | null
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  )
}

export function ExerciseDetailDrawer({
  open,
  onOpenChange,
  exercise,
}: ExerciseDetailDrawerProps) {
  const displayExerciseName = useExerciseDisplayName(exercise?.exerciseName)
  const { data: content, isLoading } = useExerciseContent(exercise?.exerciseId, open)
  const muscleGroup = content?.muscle_group ?? exercise?.muscleGroup

  const muscleLabel = useMemo(() => {
    if (!muscleGroup) {
      return MUSCLE_GROUP_LABELS.full_body
    }

    return MUSCLE_GROUP_LABELS[normalizeMuscleGroup(muscleGroup)]
  }, [muscleGroup])

  const equipmentLabel = formatEquipmentLabel(exercise?.equipment)

  const coaching = useMemo(() => {
    const fallback = buildTemplateCoachingCues({
      muscleGroup: content?.muscle_group ?? exercise?.muscleGroup,
      equipment: content?.equipment ?? exercise?.equipment,
      trackingMode: content?.tracking_mode,
    })

    if (!content && !isLoading) {
      return fallback
    }

    return resolveExerciseCoaching(
      content?.coaching_cues,
      content?.description_fr,
      fallback,
    )
  }, [content, exercise?.equipment, exercise?.muscleGroup, isLoading])

  const contentStatus = (content?.content_status ??
    (isLoading ? 'pending' : 'partial')) as ExerciseContentStatus

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display font-black">
            {displayExerciseName || "Détails de l'exercice"}
          </DrawerTitle>
          <DrawerDescription>
            Consignes d&apos;exécution, zone musculaire et équipement.
          </DrawerDescription>
        </DrawerHeader>

        {exercise ? (
          <div className="mt-2 space-y-5">
            {content?.demo_file_id ? (
              <ExerciseDemoPlayer
                demoFileId={content.demo_file_id}
                posterFileId={content.demo_poster_file_id}
                muscleGroup={muscleGroup}
                contentStatus={contentStatus}
                exerciseName={displayExerciseName || exercise.exerciseName}
              />
            ) : null}

            <ExerciseCoachingText coaching={coaching} />

            <ExerciseBodyMap muscleGroup={muscleGroup} />

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Zone musculaire">
                <div className="flex items-center gap-2">
                  <Pill tone="primary">{muscleLabel}</Pill>
                </div>
              </DetailRow>

              <DetailRow label="Équipement">
                {equipmentLabel ? (
                  <div className="flex items-center gap-2">
                    <Dumbbell className="size-4 text-muted-foreground" />
                    <span>{equipmentLabel}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Non renseigné</span>
                )}
              </DetailRow>
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
