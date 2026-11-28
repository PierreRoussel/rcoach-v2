import { useMemo, useState } from 'react'

import { ExerciseEquipmentChips } from '@/components/workout/ExerciseEquipmentChips'
import { QuickAddIconButton } from '@/components/ui/quick-add-icon-button'
import { Pill } from '@/design-system'
import type { Exercise } from '@/lib/graphql/operations'
import {
  familyGroupMetaLabel,
  groupExercisesByFamily,
  type FamilyGroup,
} from '@/lib/workout/exercise-equipment-family'
import { formatEquipmentOptionsSubtitle } from '@/lib/workout/exercise-labels'
import {
  defaultLineEquipment,
  resolveEquipmentOptions,
} from '@/lib/workout/exercise-instance-key'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'
import { cn } from '@/lib/utils'

export type ExerciseQuickAddState = {
  exerciseId: string
  status: 'adding' | 'success'
} | null

type ExerciseSearchListProps = {
  exercises: Exercise[]
  onSelect: (exercise: Exercise, equipment?: string) => void
  onQuickAdd?: (exercise: Exercise) => void
  quickAddState?: ExerciseQuickAddState
  emptyLabel?: string
  sectionTitle?: string
  /** When false, render flat rows (e.g. recent unique list). Default true. */
  groupByFamily?: boolean
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

function FamilySearchRow({
  group,
  expanded,
  onToggle,
  onSelect,
  onQuickAdd,
  quickAddState,
  pendingQuickAdd: _pendingQuickAdd,
  onPendingQuickAdd,
  onClearPendingQuickAdd: _onClearPendingQuickAdd,
}: {
  group: FamilyGroup
  expanded: boolean
  onToggle: () => void
  onSelect: (exercise: Exercise, equipment?: string) => void
  onQuickAdd?: (exercise: Exercise) => void
  quickAddState: ExerciseQuickAddState
  pendingQuickAdd: boolean
  onPendingQuickAdd: () => void
  onClearPendingQuickAdd: () => void
}) {
  const multi = group.variants.length > 1
  const only = group.variants[0]!
  const isPersonal = group.variants.some((variant) => !variant.is_public)

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => {
            if (multi) {
              onToggle()
              return
            }
            onSelect(only, defaultLineEquipment(only))
          }}
        >
          <div className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
            <span className="truncate">{group.baseLabel}</span>
            {isPersonal ? <Pill tone="purple">Perso</Pill> : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {familyGroupMetaLabel(group)}
          </div>
        </button>
        {onQuickAdd ? (
          multi ? (
            <QuickAddIconButton
              itemName={group.baseLabel}
              rowStatus={null}
              onQuickAdd={() => {
                if (!expanded) {
                  onToggle()
                }
                onPendingQuickAdd()
              }}
            />
          ) : (
            <QuickAddButton
              exercise={only}
              quickAddState={quickAddState}
              onQuickAdd={onQuickAdd}
            />
          )
        ) : null}
      </div>
      {multi && expanded ? (
        <p className="mt-2 text-xs text-muted-foreground">Plusieurs variantes — utilisez la recherche après fusion.</p>
      ) : null}
    </div>
  )
}

function FlatSearchRow({
  exercise,
  onSelect,
  onQuickAdd,
  quickAddState,
}: {
  exercise: Exercise
  onSelect: (exercise: Exercise, equipment?: string) => void
  onQuickAdd?: (exercise: Exercise) => void
  quickAddState: ExerciseQuickAddState
}) {
  const [pickEquipment, setPickEquipment] = useState(false)
  const options = resolveEquipmentOptions(exercise)
  const multi = options.length > 1
  const muscle =
    exercise.muscle_group != null
      ? MUSCLE_GROUP_LABELS[normalizeMuscleGroup(exercise.muscle_group)]
      : null

  function confirm(equipment: string) {
    onSelect({ ...exercise, equipment }, equipment)
    setPickEquipment(false)
  }

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => {
            if (multi) {
              setPickEquipment((value) => !value)
              return
            }
            confirm(defaultLineEquipment(exercise))
          }}
        >
          <div className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
            <span className="truncate">
              {exercise.name_fr?.trim() || exercise.name}
            </span>
            {!exercise.is_public ? <Pill tone="purple">Perso</Pill> : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {[muscle, formatEquipmentOptionsSubtitle(exercise)].filter(Boolean).join(' · ') || '—'}
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
      {multi && pickEquipment ? (
        <ExerciseEquipmentChips
          className="mt-2"
          options={options}
          selectedEquipment={defaultLineEquipment(exercise)}
          onSelect={confirm}
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
  groupByFamily = false,
  className,
}: ExerciseSearchListProps) {
  const groups = useMemo(
    () => (groupByFamily ? groupExercisesByFamily(exercises) : []),
    [exercises, groupByFamily],
  )
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [pendingQuickAddKey, setPendingQuickAddKey] = useState<string | null>(null)

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
        {groupByFamily
          ? groups.map((group) => (
              <FamilySearchRow
                key={group.familyKey}
                group={group}
                expanded={expandedKey === group.familyKey}
                onToggle={() =>
                  setExpandedKey((current) =>
                    current === group.familyKey ? null : group.familyKey,
                  )
                }
                onSelect={onSelect}
                onQuickAdd={onQuickAdd}
                quickAddState={quickAddState}
                pendingQuickAdd={pendingQuickAddKey === group.familyKey}
                onPendingQuickAdd={() => setPendingQuickAddKey(group.familyKey)}
                onClearPendingQuickAdd={() => setPendingQuickAddKey(null)}
              />
            ))
          : exercises.map((exercise) => (
              <FlatSearchRow
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
