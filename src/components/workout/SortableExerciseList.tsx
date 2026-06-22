import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, GripVertical, Link2, ListOrdered, MoreVertical, Plus, Trash2, Unlink } from 'lucide-react'
import type { ReactNode } from 'react'

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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'

const SUPERSET_ACCENTS = [
  'border-primary/60 bg-primary/5',
  'border-secondary/60 bg-secondary/10',
  'border-accent/60 bg-accent/10',
] as const

type SortableExerciseListProps = {
  exercises: ActiveExerciseEntry[]
  activeIndex: number
  onSelect: (index: number) => void
  onReorder: (from: number, to: number) => void
  onRemove: (index: number) => void
  showSetCount?: boolean
  dragHandle?: 'subtle' | 'default'
  showDeleteButton?: boolean
  embedded?: boolean
  onAddToSuperset?: (fromIndex: number, partnerIndex: number) => void
  onRemoveFromSuperset?: (index: number) => void
  renderSetsContent?: (index: number) => ReactNode
  onOpenReorder?: () => void
  onAddSet?: (index: number) => void
  renderBelowTitle?: (index: number) => ReactNode
}

function supersetAccentClass(supersetId: number) {
  return SUPERSET_ACCENTS[(supersetId - 1) % SUPERSET_ACCENTS.length]
}

function ExerciseActionsMenu({
  index,
  exercises,
  onRemove,
  onAddToSuperset,
  onRemoveFromSuperset,
  onOpenReorder,
  onAddSet,
}: {
  index: number
  exercises: ActiveExerciseEntry[]
  onRemove?: () => void
  onAddToSuperset?: (fromIndex: number, partnerIndex: number) => void
  onRemoveFromSuperset?: (index: number) => void
  onOpenReorder?: () => void
  onAddSet?: (index: number) => void
}) {
  const exercise = exercises[index]
  const partners = exercises
    .map((item, itemIndex) => ({ item, itemIndex }))
    .filter(({ itemIndex }) => itemIndex !== index)
  const hasSupersetActions = onAddToSuperset && onRemoveFromSuperset

  if (!hasSupersetActions && !onOpenReorder && !onRemove && !onAddSet) {
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
        {onAddSet ? (
          <DropdownMenuItem onClick={() => onAddSet(index)}>
            <Plus className="size-4" />
            Ajouter une serie
          </DropdownMenuItem>
        ) : null}
        {hasSupersetActions && (onOpenReorder || onAddSet) ? <DropdownMenuSeparator /> : null}
        {hasSupersetActions && partners.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Link2 className="size-4" />
              Ajouter a un superset
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
              {partners.map(({ item, itemIndex }) => (
                <DropdownMenuItem
                  key={item.exerciseId}
                  onClick={() => onAddToSuperset(index, itemIndex)}
                >
                  {item.exerciseName}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        {hasSupersetActions && exercise?.supersetId != null ? (
          <>
            {partners.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onClick={() => onRemoveFromSuperset(index)}>
              <Unlink className="size-4" />
              Retirer du superset
            </DropdownMenuItem>
          </>
        ) : null}
        {onRemove ? (
          <>
            {onOpenReorder || hasSupersetActions || onAddSet ? <DropdownMenuSeparator /> : null}
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
  dragHandle,
  showDeleteButton,
  embedded,
  onAddToSuperset,
  onRemoveFromSuperset,
  onOpenReorder,
  onAddSet,
  renderSetsContent,
  renderBelowTitle,
  supersetBadge,
}: {
  exercise: ActiveExerciseEntry
  index: number
  exercises: ActiveExerciseEntry[]
  isActive: boolean
  onSelect: () => void
  onRemove: () => void
  showSetCount: boolean
  dragHandle: 'subtle' | 'default'
  showDeleteButton: boolean
  embedded: boolean
  onAddToSuperset?: (fromIndex: number, partnerIndex: number) => void
  onRemoveFromSuperset?: (index: number) => void
  onOpenReorder?: () => void
  onAddSet?: (index: number) => void
  renderSetsContent?: (index: number) => ReactNode
  renderBelowTitle?: (index: number) => ReactNode
  supersetBadge?: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.exerciseId })

  const inSuperset = exercise.supersetId != null
  const accent =
    inSuperset && exercise.supersetId != null
      ? supersetAccentClass(exercise.supersetId)
      : null
  const hasSetsSection = renderSetsContent != null

  const card = (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'group w-full rounded-2xl border',
        embedded ? 'rounded-none border-x-0 border-t-0 first:border-t' : null,
        isActive ? 'border-primary bg-soft-primary/60' : 'border-border bg-card',
        inSuperset && !isActive && accent,
        isDragging && 'opacity-70 shadow-md',
      )}
    >
      <div className={cn('flex w-full items-center gap-2 py-2', embedded ? 'px-4' : 'px-3')}>
        <button
          type="button"
          className={cn(
            'shrink-0 text-muted-foreground',
            dragHandle === 'subtle'
              ? 'cursor-grab opacity-0 transition-opacity group-hover:opacity-40 active:cursor-grabbing active:opacity-70'
              : 'cursor-grab active:cursor-grabbing',
          )}
          aria-label="Reordonner"
          {...attributes}
          {...listeners}
        >
          <GripVertical className={dragHandle === 'subtle' ? 'size-3' : 'size-4'} />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
          <div className="flex items-center gap-2">
            <p className="truncate font-display font-black">{exercise.exerciseName}</p>
            {supersetBadge != null ? (
              <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 font-data text-[10px] font-semibold uppercase tracking-wide text-primary">
                S{supersetBadge}
              </span>
            ) : null}
          </div>
          {renderBelowTitle?.(index)}
          {showSetCount ? (
            <p className="text-xs text-muted-foreground">{exercise.sets.length} sets</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {exercise.muscleGroup ?? exercise.equipment ?? '—'}
            </p>
          )}
        </button>
        {hasSetsSection ? (
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 [&[data-state=open]>svg]:rotate-180"
              aria-label="Replier ou deplier les series"
            >
              <ChevronDown className="size-4 transition-transform duration-200" />
            </Button>
          </CollapsibleTrigger>
        ) : null}
        <ExerciseActionsMenu
          index={index}
          exercises={exercises}
          onRemove={showDeleteButton ? undefined : onRemove}
          onAddToSuperset={onAddToSuperset}
          onRemoveFromSuperset={onRemoveFromSuperset}
          onOpenReorder={onOpenReorder}
          onAddSet={onAddSet}
        />
        {showDeleteButton ? (
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
      {hasSetsSection ? (
        <CollapsibleContent
          className={cn(
            'border-t border-border/60 py-3',
            embedded ? 'px-0' : 'px-3',
          )}
        >
          {renderSetsContent(index)}
        </CollapsibleContent>
      ) : null}
    </div>
  )

  if (hasSetsSection) {
    return <Collapsible defaultOpen>{card}</Collapsible>
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
  dragHandle = 'default',
  showDeleteButton = true,
  embedded = false,
  onAddToSuperset,
  onRemoveFromSuperset,
  renderSetsContent,
  onOpenReorder,
  onAddSet,
  renderBelowTitle,
}: SortableExerciseListProps) {
  const sensors = useSortableSensors()

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
        dragHandle={dragHandle}
        showDeleteButton={showDeleteButton}
        embedded={embedded}
        onAddToSuperset={onAddToSuperset}
        onRemoveFromSuperset={onRemoveFromSuperset}
        onOpenReorder={onOpenReorder}
        onAddSet={onAddSet}
        renderSetsContent={renderSetsContent}
        renderBelowTitle={renderBelowTitle}
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
                <p className="px-4 font-data text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Superset {unit.supersetId}
                </p>
                {unit.indices.map((index) => renderItem(index))}
              </div>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
