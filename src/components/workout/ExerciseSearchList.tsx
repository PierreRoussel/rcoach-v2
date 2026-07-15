import { Check, Loader2, Plus } from 'lucide-react'

import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import type { Exercise } from '@/lib/graphql/operations'
import { cn } from '@/lib/utils'

export type ExerciseQuickAddState = {
  exerciseId: string
  status: 'adding' | 'success'
} | null

type ExerciseSearchListProps = {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
  onQuickAdd?: (exercise: Exercise) => void
  quickAddState?: ExerciseQuickAddState
  emptyLabel?: string
  sectionTitle?: string
  className?: string
}

function QuickAddButton({
  exercise,
  quickAddState,
  onQuickAdd,
}: {
  exercise: Exercise
  quickAddState: ExerciseQuickAddState
  onQuickAdd: (exercise: Exercise) => void
}) {
  const rowStatus =
    quickAddState?.exerciseId === exercise.id ? quickAddState.status : null

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        'size-8 shrink-0 rounded-full border-primary text-primary transition-colors hover:bg-soft-primary hover:text-soft-primary-fg',
        rowStatus === 'success' && 'bg-soft-primary text-soft-primary-fg',
      )}
      disabled={rowStatus === 'adding' || rowStatus === 'success'}
      onClick={() => onQuickAdd(exercise)}
      aria-label={
        rowStatus === 'success'
          ? `${exercise.name} ajouté`
          : `Ajouter ${exercise.name}`
      }
    >
      {rowStatus === 'adding' ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : rowStatus === 'success' ? (
        <Check className="size-4 animate-motivation-pop" aria-hidden />
      ) : (
        <Plus className="size-4" aria-hidden />
      )}
    </Button>
  )
}

function ExerciseSearchRow({
  exercise,
  onSelect,
  onQuickAdd,
  quickAddState,
}: {
  exercise: Exercise
  onSelect: (exercise: Exercise) => void
  onQuickAdd?: (exercise: Exercise) => void
  quickAddState: ExerciseQuickAddState
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onSelect(exercise)}
      >
        <div className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
          <span className="truncate">
            <DisplayExerciseName
              name={exercise.name}
              nameFr={exercise.name_fr}
              exerciseId={exercise.id}
            />
          </span>
          {!exercise.is_public ? <Pill tone="purple">Perso</Pill> : null}
        </div>
        <div className="text-xs text-muted-foreground">
          {[exercise.muscle_group, exercise.equipment].filter(Boolean).join(' · ') ||
            '—'}
        </div>
      </button>
      {onQuickAdd ? (
        <QuickAddButton
          exercise={exercise}
          quickAddState={quickAddState}
          onQuickAdd={onQuickAdd}
        />
      ) : null}
    </div>
  )
}

export function ExerciseSearchList({
  exercises,
  onSelect,
  onQuickAdd,
  quickAddState = null,
  emptyLabel = 'Aucun exercice trouvé.',
  sectionTitle,
  className,
}: ExerciseSearchListProps) {
  if (exercises.length === 0) {
    return (
      <p className={cn('px-1 py-6 text-center text-sm text-muted-foreground', className)}>
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className={className}>
      {sectionTitle ? (
        <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {sectionTitle}
        </p>
      ) : null}
      <div className="divide-y divide-border/70">
        {exercises.map((exercise) => (
          <ExerciseSearchRow
            key={exercise.id}
            exercise={exercise}
            onSelect={onSelect}
            onQuickAdd={onQuickAdd}
            quickAddState={quickAddState}
          />
        ))}
      </div>
    </div>
  )
}

export function exerciseToDetailTarget(exercise: Exercise) {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    exerciseNameFr: exercise.name_fr,
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
  }
}
