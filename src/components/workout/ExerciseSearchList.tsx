import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { QuickAddIconButton } from '@/components/ui/quick-add-icon-button'
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
    <QuickAddIconButton
      itemName={exercise.name}
      rowStatus={rowStatus}
      onQuickAdd={() => onQuickAdd(exercise)}
    />
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
