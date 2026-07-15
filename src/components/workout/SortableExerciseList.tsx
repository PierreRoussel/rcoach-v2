import { useNavigate } from '@tanstack/react-router'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BarChart2, ChevronDown, GripVertical, Info, Link2, ListOrdered, MoreVertical, Plus, Replace, Trash2, Unlink } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLayoutEffect, useState } from 'react'

import { launchExercisePickerPage } from '@/components/workout/ExercisePicker'
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { SupersetMembershipDrawer } from '@/components/workout/SupersetMembershipDrawer'
import { EmomGroupDrawer } from '@/components/workout/EmomGroupDrawer'
import { Pill } from '@/design-system'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  prepareForSortableDrag,
  restorePointerInteraction,
  useSortableSensors,
  wrapSortableDragEnd,
} from '@/lib/dnd/interaction'
import { cn } from '@/lib/utils'
import { buildExerciseUnits } from '@/lib/workout/exercise-units'
import { isExerciseComplete } from '@/lib/workout/format-exercise-collapsed-summary'
import type { Exercise } from '@/lib/graphql/operations'
import {
  type ExercisePickerContext,
  type ExercisePickerReturnTo,
} from '@/lib/workout/exercise-picker-session'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'
import { WORKOUT_EXERCISE_SELECTOR_ATTR } from '@/lib/workout/scroll-to-exercise'

const SUPERSET_STYLES = [
  {
    container:
      'border-violet-300/40 bg-soft-purple/50 dark:border-violet-700/25 dark:bg-violet-950/25',
    badge: 'bg-soft-purple text-soft-purple-fg',
    label: 'text-soft-purple-fg/70',
  },
  {
    container: 'border-secondary/60 bg-secondary/10',
    badge: 'bg-soft-secondary text-soft-secondary-fg',
    label: 'text-muted-foreground',
  },
  {
    container: 'border-accent/60 bg-accent/10',
    badge: 'bg-soft-accent text-soft-accent-fg',
    label: 'text-muted-foreground',
  },
] as const

function getSupersetStyle(supersetId: number) {
  return SUPERSET_STYLES[(supersetId - 1) % SUPERSET_STYLES.length]
}

function supersetAccentClass(supersetId: number) {
  return getSupersetStyle(supersetId).container
}

function supersetBadgeClass(supersetId: number) {
  return getSupersetStyle(supersetId).badge
}

function supersetLabelClass(supersetId: number) {
  return getSupersetStyle(supersetId).label
}

type SortableExerciseListProps = {
  exercises: ActiveExerciseEntry[]
  activeIndex: number
  onSelect: (index: number) => void
  onReorder: (from: number, to: number) => void
  onRemove: (index: number) => void
  showSetCount?: boolean
  dragEnabled?: boolean
  dragHandle?: 'subtle' | 'default'
  showDeleteButton?: boolean
  embedded?: boolean
  onApplySupersetMembership?: (anchorIndex: number, partnerIndices: number[]) => void
  onRemoveFromSuperset?: (index: number) => void
  onApplyEmomGroupMembership?: (anchorIndex: number, partnerIndices: number[]) => void
  onRemoveFromEmomGroup?: (index: number) => void
  renderSetsContent?: (index: number) => ReactNode
  onOpenReorder?: () => void
  onAddSet?: (index: number) => void
  onReplace?: (index: number, exercise: Exercise) => void
  onViewStats?: (index: number) => void
  onViewDetails?: (index: number) => void
  renderBelowTitle?: (index: number) => ReactNode
  renderCollapsedSummary?: (index: number) => string | null
  pickerContext?: ExercisePickerContext
  pickerReturnTo?: ExercisePickerReturnTo
  pickerTemplateId?: string
}

function ExerciseActionsMenu({
  index,
  exercises,
  onRemove,
  onOpenSupersetDrawer,
  onRemoveFromSuperset,
  onOpenEmomGroupDrawer,
  onRemoveFromEmomGroup,
  onOpenReorder,
  onReplaceRequest,
  onViewStats,
  onViewDetails,
}: {
  index: number
  exercises: ActiveExerciseEntry[]
  onRemove?: () => void
  onOpenSupersetDrawer?: () => void
  onRemoveFromSuperset?: (index: number) => void
  onOpenEmomGroupDrawer?: () => void
  onRemoveFromEmomGroup?: (index: number) => void
  onOpenReorder?: () => void
  onReplaceRequest?: (index: number) => void
  onViewStats?: (index: number) => void
  onViewDetails?: (index: number) => void
}) {
  const exercise = exercises[index]
  const hasSupersetActions = onOpenSupersetDrawer && onRemoveFromSuperset
  const canConfigureSuperset = hasSupersetActions && exercises.length > 1
  const hasEmomActions = onOpenEmomGroupDrawer && onRemoveFromEmomGroup
  const canConfigureEmomGroup = hasEmomActions && exercises.length > 1

  if (
    !hasSupersetActions &&
    !hasEmomActions &&
    !onOpenReorder &&
    !onRemove &&
    !onReplaceRequest &&
    !onViewStats &&
    !onViewDetails
  ) {
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Actions exercice"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {onOpenReorder ? (
          <DropdownMenuItem onClick={onOpenReorder}>
            <ListOrdered className="size-4" />
            Changer l&apos;ordre
          </DropdownMenuItem>
        ) : null}
        {onReplaceRequest ? (
          <DropdownMenuItem onClick={() => onReplaceRequest(index)}>
            <Replace className="size-4" />
            Remplacer
          </DropdownMenuItem>
        ) : null}
        {onViewDetails ? (
          <DropdownMenuItem onClick={() => onViewDetails(index)}>
            <Info className="size-4" />
            Détails de l&apos;exercice
          </DropdownMenuItem>
        ) : null}
        {onViewStats ? (
          <DropdownMenuItem onClick={() => onViewStats(index)}>
            <BarChart2 className="size-4" />
            Statistiques
          </DropdownMenuItem>
        ) : null}
        {hasSupersetActions &&
        (onOpenReorder || onReplaceRequest || onViewStats || onViewDetails) ? (
          <DropdownMenuSeparator />
        ) : null}
        {canConfigureSuperset ? (
          <DropdownMenuItem onClick={onOpenSupersetDrawer}>
            <Link2 className="size-4" />
            Configurer le superset
          </DropdownMenuItem>
        ) : null}
        {hasSupersetActions && exercise?.supersetId != null ? (
          <>
            {canConfigureSuperset ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onClick={() => onRemoveFromSuperset(index)}>
              <Unlink className="size-4" />
              Retirer du superset
            </DropdownMenuItem>
          </>
        ) : null}
        {hasEmomActions &&
        (onOpenReorder || onReplaceRequest || onViewStats || onViewDetails || hasSupersetActions) ? (
          <DropdownMenuSeparator />
        ) : null}
        {canConfigureEmomGroup ? (
          <DropdownMenuItem onClick={onOpenEmomGroupDrawer}>
            <Link2 className="size-4" />
            Grouper dans la même minute
          </DropdownMenuItem>
        ) : null}
        {hasEmomActions && exercise?.emomGroupId != null ? (
          <>
            {canConfigureEmomGroup ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onClick={() => onRemoveFromEmomGroup(index)}>
              <Unlink className="size-4" />
              Retirer du groupe minute
            </DropdownMenuItem>
          </>
        ) : null}
        {onRemove ? (
          <>
            {onOpenReorder || hasSupersetActions || hasEmomActions || onReplaceRequest || onViewStats || onViewDetails ? (
              <DropdownMenuSeparator />
            ) : null}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
              Supprimer l&apos;exercice
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SortableExerciseItem({
  exercise,
  index,
  exercises,
  isActive,
  onSelect,
  onRemove,
  showSetCount,
  dragEnabled = true,
  dragHandle,
  showDeleteButton,
  embedded,
  onOpenSupersetDrawer,
  onRemoveFromSuperset,
  onOpenEmomGroupDrawer,
  onRemoveFromEmomGroup,
  onOpenReorder,
  onAddSet,
  onReplaceRequest,
  onViewStats,
  onViewDetails,
  renderSetsContent,
  renderBelowTitle,
  renderCollapsedSummary,
  supersetBadge,
}: {
  exercise: ActiveExerciseEntry
  index: number
  exercises: ActiveExerciseEntry[]
  isActive: boolean
  onSelect: () => void
  onRemove: () => void
  showSetCount: boolean
  dragEnabled: boolean
  dragHandle: 'subtle' | 'default'
  showDeleteButton: boolean
  embedded: boolean
  onOpenSupersetDrawer?: () => void
  onRemoveFromSuperset?: (index: number) => void
  onOpenEmomGroupDrawer?: () => void
  onRemoveFromEmomGroup?: (index: number) => void
  onOpenReorder?: () => void
  onAddSet?: (index: number) => void
  onReplaceRequest?: (index: number) => void
  onViewStats?: (index: number) => void
  onViewDetails?: (index: number) => void
  renderSetsContent?: (index: number) => ReactNode
  renderBelowTitle?: (index: number) => ReactNode
  renderCollapsedSummary?: (index: number) => string | null
  supersetBadge?: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.exerciseId, disabled: !dragEnabled })

  const exerciseComplete = isExerciseComplete(exercise.sets)
  const [open, setOpen] = useState(() => !exerciseComplete)

  useLayoutEffect(() => {
    if (exerciseComplete) {
      setOpen((current) => (current ? false : current))
      return
    }

    if (isActive) {
      setOpen((current) => (current ? current : true))
    }
  }, [exerciseComplete, isActive])

  const inSuperset = exercise.supersetId != null
  const accent =
    inSuperset && exercise.supersetId != null
      ? supersetAccentClass(exercise.supersetId)
      : null
  const hasSetsSection = renderSetsContent != null
  const collapsedSummary = renderCollapsedSummary?.(index) ?? null
  const showCollapsedHeader = hasSetsSection && !open && exerciseComplete

  const card = (
    <div
      ref={setNodeRef}
      {...{ [WORKOUT_EXERCISE_SELECTOR_ATTR]: exercise.exerciseId }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'group w-full rounded-2xl border',
        embedded ? 'rounded-none border-x-0 border-t-0 first:border-t' : null,
        inSuperset && accent,
        isActive && inSuperset && 'border-primary ring-2 ring-inset ring-primary/35',
        isActive && !inSuperset && 'border-primary bg-soft-primary/60',
        !isActive && !inSuperset && 'border-border bg-card',
        isDragging && 'opacity-70 shadow-md',
      )}
    >
      <div
        className={cn(
          'flex w-full items-center gap-2 py-2',
          embedded ? 'pl-4 pr-0' : 'pl-3 pr-0',
        )}
      >
        {dragEnabled ? (
          <button
            type="button"
            className={cn(
              'shrink-0 text-muted-foreground',
              dragHandle === 'subtle'
                ? 'cursor-grab opacity-0 transition-opacity group-hover:opacity-40 active:cursor-grabbing active:opacity-70'
                : 'cursor-grab active:cursor-grabbing',
            )}
            aria-label="Réordonner"
            {...attributes}
            {...listeners}
          >
            <GripVertical className={dragHandle === 'subtle' ? 'size-3' : 'size-4'} />
          </button>
        ) : null}
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
          {showCollapsedHeader ? (
            <div className="flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate font-display text-sm font-black text-foreground">
                <DisplayExerciseName
                  name={exercise.exerciseName}
                  nameFr={exercise.exerciseNameFr}
                  exerciseId={exercise.exerciseId}
                />
              </p>
              <Pill tone="secondary" className="shrink-0 px-2 py-0.5 text-[10px]">
                Terminé
              </Pill>
              {supersetBadge != null ? (
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 font-data text-[10px] font-semibold uppercase tracking-wide',
                    supersetBadgeClass(supersetBadge),
                  )}
                >
                  S{supersetBadge}
                </span>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="truncate font-display font-black">
                  <DisplayExerciseName
                    name={exercise.exerciseName}
                    nameFr={exercise.exerciseNameFr}
                    exerciseId={exercise.exerciseId}
                  />
                </p>
                {exerciseComplete ? (
                  <Pill tone="secondary" className="shrink-0 px-2 py-0.5 text-[10px]">
                    Terminé
                  </Pill>
                ) : null}
                {supersetBadge != null ? (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 font-data text-[10px] font-semibold uppercase tracking-wide',
                      supersetBadgeClass(supersetBadge),
                    )}
                  >
                    S{supersetBadge}
                  </span>
                ) : null}
              </div>
              {open ? renderBelowTitle?.(index) : null}
              {showSetCount ? (
                <p className="text-xs text-muted-foreground">{exercise.sets.length} sets</p>
              ) : null}
            </>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {showCollapsedHeader && collapsedSummary ? (
            <p className="font-display text-sm font-black tabular-nums text-foreground">
              {collapsedSummary}
            </p>
          ) : null}
          <div className="flex items-center gap-0">
            {hasSetsSection ? (
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 [&[data-state=open]>svg]:rotate-180"
                  aria-label="Replier ou déplier les séries"
                >
                  <ChevronDown className="size-4 transition-transform duration-200" />
                </Button>
              </CollapsibleTrigger>
            ) : null}
            <ExerciseActionsMenu
              index={index}
              exercises={exercises}
              onRemove={showDeleteButton ? undefined : onRemove}
              onOpenSupersetDrawer={onOpenSupersetDrawer}
              onRemoveFromSuperset={onRemoveFromSuperset}
              onOpenEmomGroupDrawer={onOpenEmomGroupDrawer}
              onRemoveFromEmomGroup={onRemoveFromEmomGroup}
              onOpenReorder={onOpenReorder}
              onReplaceRequest={onReplaceRequest}
              onViewStats={onViewStats}
              onViewDetails={onViewDetails}
            />
          </div>
          {showDeleteButton ? (
            <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      {hasSetsSection ? (
        <CollapsibleContent
          className={cn(
            embedded ? 'px-0 pb-0 pt-0' : 'border-t border-border/60 px-3 py-3',
          )}
        >
          {renderSetsContent(index)}
          {onAddSet ? (
            <div className={embedded ? undefined : 'pt-2'}>
              <Button
                type="button"
                variant={embedded ? 'ghost' : 'outline'}
                size="sm"
                className={cn(
                  embedded
                    ? 'h-auto min-h-11 w-full rounded-none border-0 border-t border-dashed border-border/70 bg-transparent px-4 py-3.5 text-xs font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                    : null,
                )}
                onClick={() => onAddSet(index)}
              >
                <Plus className={cn('size-4', embedded && 'size-3.5 opacity-70')} />
                Ajouter une série
              </Button>
            </div>
          ) : null}
        </CollapsibleContent>
      ) : null}
    </div>
  )

  if (hasSetsSection) {
    return (
      <Collapsible
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && isActive && !exerciseComplete) {
            return
          }

          setOpen(nextOpen)
        }}
      >
        {card}
      </Collapsible>
    )
  }

  return card
}

type RenderUnit =
  | { type: 'single'; index: number }
  | { type: 'superset'; supersetId: number; indices: number[] }

function buildRenderUnits(exercises: ActiveExerciseEntry[]): RenderUnit[] {
  return buildExerciseUnits(exercises)
}

function isSplitSuperset(
  exercises: ActiveExerciseEntry[],
  index: number,
): number | undefined {
  const supersetId = exercises[index]?.supersetId
  if (supersetId == null) {
    return undefined
  }

  const sameGroup = exercises.filter(
    (exercise) => exercise.supersetId === supersetId,
  )
  if (sameGroup.length < 2) {
    return undefined
  }

  const indices = exercises
    .map((exercise, exerciseIndex) =>
      exercise.supersetId === supersetId ? exerciseIndex : -1,
    )
    .filter((exerciseIndex) => exerciseIndex >= 0)

  const isConsecutive = indices.every(
    (exerciseIndex, position) =>
      position === 0 || exerciseIndex === indices[position - 1]! + 1,
  )

  return isConsecutive ? undefined : supersetId
}

export function SortableExerciseList({
  exercises,
  activeIndex,
  onSelect,
  onReorder,
  onRemove,
  showSetCount = true,
  dragEnabled = true,
  dragHandle = 'default',
  showDeleteButton = true,
  embedded = false,
  onApplySupersetMembership,
  onRemoveFromSuperset,
  onApplyEmomGroupMembership,
  onRemoveFromEmomGroup,
  renderSetsContent,
  onOpenReorder,
  onAddSet,
  onReplace,
  onViewStats,
  onViewDetails,
  renderBelowTitle,
  renderCollapsedSummary,
  pickerContext = 'active',
  pickerReturnTo,
  pickerTemplateId,
}: SortableExerciseListProps) {
  const navigate = useNavigate()
  const sensors = useSortableSensors()
  const [supersetAnchorIndex, setSupersetAnchorIndex] = useState<number | null>(null)
  const [emomGroupAnchorIndex, setEmomGroupAnchorIndex] = useState<number | null>(null)

  function handleReplaceRequest(index: number) {
    if (!onReplace || !pickerReturnTo) {
      return
    }

    launchExercisePickerPage({
      excludeIds: exercises
        .filter((_, itemIndex) => itemIndex !== index)
        .map((exercise) => exercise.exerciseId),
      mode: 'replace',
      replaceIndex: index,
      context: pickerContext,
      returnTo: pickerReturnTo,
      templateId: pickerTemplateId,
      navigate: (options) => void navigate(options),
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = exercises.findIndex((item) => item.exerciseId === active.id)
    const newIndex = exercises.findIndex((item) => item.exerciseId === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    onReorder(oldIndex, newIndex)
  }

  function renderItem(index: number) {
    return (
      <SortableExerciseItem
        key={exercises[index]!.exerciseId}
        exercise={exercises[index]!}
        index={index}
        exercises={exercises}
        isActive={index === activeIndex}
        onSelect={() => onSelect(index)}
        onRemove={() => onRemove(index)}
        showSetCount={showSetCount}
        dragEnabled={dragEnabled}
        dragHandle={dragHandle}
        showDeleteButton={showDeleteButton}
        embedded={embedded}
        onOpenSupersetDrawer={
          onApplySupersetMembership
            ? () => setSupersetAnchorIndex(index)
            : undefined
        }
        onRemoveFromSuperset={onRemoveFromSuperset}
        onOpenEmomGroupDrawer={
          onApplyEmomGroupMembership
            ? () => setEmomGroupAnchorIndex(index)
            : undefined
        }
        onRemoveFromEmomGroup={onRemoveFromEmomGroup}
        onOpenReorder={onOpenReorder}
        onAddSet={onAddSet}
        onReplaceRequest={onReplace ? handleReplaceRequest : undefined}
        onViewStats={onViewStats}
        onViewDetails={onViewDetails}
        renderSetsContent={renderSetsContent}
        renderBelowTitle={renderBelowTitle}
        renderCollapsedSummary={renderCollapsedSummary}
        supersetBadge={isSplitSuperset(exercises, index)}
      />
    )
  }

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ajoutez des exercices depuis le catalogue.
      </p>
    )
  }

  const units = buildRenderUnits(exercises)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={prepareForSortableDrag}
      onDragCancel={restorePointerInteraction}
      onDragEnd={wrapSortableDragEnd(handleDragEnd)}
    >
      <SortableContext
        items={exercises.map((exercise) => exercise.exerciseId)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-2', embedded && 'space-y-0')}>
          {units.map((unit) => {
            if (unit.type === 'single') {
              return renderItem(unit.index)
            }

            return (
              <div
                key={`superset-${unit.supersetId}-${unit.indices[0]}`}
                className={cn(
                  'space-y-0 rounded-2xl border-2 border-dashed',
                  embedded ? 'border-x-0' : 'space-y-2 p-2',
                  supersetAccentClass(unit.supersetId),
                )}
              >
                <p
                  className={cn(
                    'px-4 font-data text-[10px] font-semibold uppercase tracking-widest',
                    supersetLabelClass(unit.supersetId),
                  )}
                >
                  Superset {unit.supersetId}
                </p>
                {unit.indices.map((index) => renderItem(index))}
              </div>
            )
          })}
        </div>
      </SortableContext>

      {onApplySupersetMembership ? (
        <SupersetMembershipDrawer
          open={supersetAnchorIndex != null}
          onOpenChange={(open) => {
            if (!open) {
              setSupersetAnchorIndex(null)
            }
          }}
          exercises={exercises}
          anchorIndex={supersetAnchorIndex}
          onConfirm={onApplySupersetMembership}
        />
      ) : null}

      {onApplyEmomGroupMembership ? (
        <EmomGroupDrawer
          open={emomGroupAnchorIndex != null}
          onOpenChange={(open) => {
            if (!open) {
              setEmomGroupAnchorIndex(null)
            }
          }}
          exercises={exercises}
          anchorIndex={emomGroupAnchorIndex}
          onConfirm={onApplyEmomGroupMembership}
        />
      ) : null}
    </DndContext>
  )
}
