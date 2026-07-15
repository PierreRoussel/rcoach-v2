import { Dumbbell, Plus } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

import { ExerciseBodyMap } from '@/components/workout/ExerciseBodyMap'
import { ExerciseCoachingText } from '@/components/workout/ExerciseCoachingText'
import { ExerciseDemoPlayer } from '@/components/workout/ExerciseDemoPlayer'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
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
  'exerciseId' | 'exerciseName' | 'exerciseNameFr' | 'muscleGroup' | 'equipment'
>

type ExerciseDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: ExerciseDetailDrawerTarget | null
  headerAction?: ReactNode
  onAdd?: () => void
  addLabel?: string
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
  headerAction,
  onAdd,
  addLabel = "Ajouter l'exercice",
}: ExerciseDetailDrawerProps) {
  const displayExerciseName = useExerciseDisplayName(
    exercise?.exerciseName,
    exercise?.exerciseNameFr,
    exercise?.exerciseId,
  )
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
      <DrawerContent className="flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl px-0">
        <DrawerHeader className="shrink-0 px-4 pb-2 text-left">
          <div className="flex items-start justify-between gap-3">
            <DrawerTitle className="min-w-0 flex-1 font-display font-black">
              {displayExerciseName || "Détails de l'exercice"}
            </DrawerTitle>
            {headerAction ??
              (onAdd ? (
                <Button
                  type="button"
                  variant="pill"
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={onAdd}
                >
                  <Plus className="size-4 sm:hidden" aria-hidden />
                  <span className="hidden sm:inline">{addLabel}</span>
                  <span className="sr-only sm:hidden">{addLabel}</span>
                </Button>
              ) : null)}
          </div>
        </DrawerHeader>

        {exercise ? (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
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
