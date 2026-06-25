import { useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Flame, GripVertical, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  prepareForSortableDrag,
  restorePointerInteraction,
  useSortableSensors,
  wrapSortableDragEnd,
} from '@/lib/dnd/interaction'
import { cn } from '@/lib/utils'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'

export type SetOptionsSetType = 'normal' | 'warmup' | 'failure'

export type SetOptionsSet = {
  setIndex: number
  setType?: SetOptionsSetType
  weightKg: number | null
  reps: number | null
  completedAt?: string | null
}

type SetOptionsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseName: string | null
  sets: SetOptionsSet[]
  selectedSetIndex: number | null
  onDeleteSet: (setIndex: number) => void
  onReorderSets: (fromIndex: number, toIndex: number) => void
  onUpdateSetType: (setIndex: number, setType: SetOptionsSetType) => void
}

function setLabel(set: SetOptionsSet, index: number) {
  if (set.setType === 'warmup') {
    return 'Echauffement'
  }

  if (set.setType === 'failure') {
    return `Serie ${index + 1} (echec)`
  }

  return `Serie ${index + 1}`
}

function SortableSetItem({
  set,
  index,
  isSelected,
}: {
  set: SetOptionsSet
  index: number
  isSelected: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: set.setIndex })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-3 py-2.5',
        isSelected
          ? 'border-primary bg-soft-primary/50'
          : 'border-border bg-card',
        isDragging && 'opacity-70 shadow-md',
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Reordonner la serie"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-black">{setLabel(set, index)}</p>
        <p className="text-xs text-muted-foreground">
          {set.weightKg != null ? `${set.weightKg} kg` : '—'} x{' '}
          {set.reps ?? '—'} reps
          {set.completedAt ? ' · validee' : ''}
        </p>
      </div>
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full font-data text-xs font-bold',
          set.setType === 'warmup'
            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
            : 'bg-muted text-foreground',
        )}
      >
        {set.setType === 'warmup' ? 'W' : index + 1}
      </span>
    </div>
  )
}

export function SetOptionsDrawer({
  open,
  onOpenChange,
  exerciseName,
  sets,
  selectedSetIndex,
  onDeleteSet,
  onReorderSets,
  onUpdateSetType,
}: SetOptionsDrawerProps) {
  const sensors = useSortableSensors()
  const displayExerciseName = useExerciseDisplayName(exerciseName)
  const [localSelectedIndex, setLocalSelectedIndex] = useState<number | null>(null)
  const selectedIndex = open ? (localSelectedIndex ?? selectedSetIndex) : null
  const selectedSet = selectedIndex != null ? sets[selectedIndex] : null

  function handleOpenChange(next: boolean) {
    if (!next) {
      setLocalSelectedIndex(null)
      restorePointerInteraction()
    }
    onOpenChange(next)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = sets.findIndex((set) => set.setIndex === active.id)
    const newIndex = sets.findIndex((set) => set.setIndex === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    onReorderSets(oldIndex, newIndex)
    setLocalSelectedIndex((current) => {
      const baseIndex = current ?? selectedSetIndex
      if (baseIndex == null) {
        return current
      }

      if (baseIndex === oldIndex) {
        return newIndex
      }

      if (oldIndex < baseIndex && newIndex >= baseIndex) {
        return baseIndex - 1
      }

      if (oldIndex > baseIndex && newIndex <= baseIndex) {
        return baseIndex + 1
      }

      return current
    })
  }

  function handleDelete() {
    if (selectedIndex == null) {
      return
    }

    const setIndex = sets[selectedIndex]?.setIndex
    if (setIndex == null) {
      return
    }

    onDeleteSet(setIndex)
    handleOpenChange(false)
  }

  function toggleWarmup() {
    if (selectedIndex == null || !selectedSet) {
      return
    }

    onUpdateSetType(
      selectedSet.setIndex,
      selectedSet.setType === 'warmup' ? 'normal' : 'warmup',
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display font-black">
            {selectedSet ? setLabel(selectedSet, selectedIndex ?? 0) : 'Serie'}
          </SheetTitle>
          <SheetDescription>
            {displayExerciseName || 'Options de la serie selectionnee'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          <Button
            type="button"
            variant={selectedSet?.setType === 'warmup' ? 'pill' : 'outline'}
            className="w-full justify-start rounded-xl"
            disabled={selectedIndex == null}
            onClick={toggleWarmup}
          >
            <Flame className="size-4" />
            {selectedSet?.setType === 'warmup'
              ? 'Marquer comme serie de travail'
              : 'Marquer en serie d echauffement'}
          </Button>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ordre des series
            </p>
            {sets.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={prepareForSortableDrag}
                onDragCancel={restorePointerInteraction}
                onDragEnd={wrapSortableDragEnd(handleDragEnd)}
              >
                <SortableContext
                  items={sets.map((set) => set.setIndex)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sets.map((set, index) => (
                      <SortableSetItem
                        key={set.setIndex}
                        set={set}
                        index={index}
                        isSelected={index === selectedIndex}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={selectedIndex == null || sets.length <= 1}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            Supprimer cette serie
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
