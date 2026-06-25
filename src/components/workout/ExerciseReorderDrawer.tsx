import { useEffect } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

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
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'

type ExerciseReorderDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: ActiveExerciseEntry[]
  onReorder: (from: number, to: number) => void
}

function ReorderItem({
  exercise,
  index,
}: {
  exercise: ActiveExerciseEntry
  index: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.exerciseId })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5',
        isDragging && 'opacity-70 shadow-md',
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-black">
          <DisplayExerciseName name={exercise.exerciseName} />
        </p>
        <p className="text-xs text-muted-foreground">
          {exercise.sets.length} série{exercise.sets.length !== 1 ? 's' : ''}
        </p>
      </div>
      <span className="shrink-0 font-data text-xs text-muted-foreground">
        {index + 1}
      </span>
    </div>
  )
}

export function ExerciseReorderDrawer({
  open,
  onOpenChange,
  exercises,
  onReorder,
}: ExerciseReorderDrawerProps) {
  const sensors = useSortableSensors()

  useEffect(() => {
    if (!open) {
      restorePointerInteraction()
    }
  }, [open])

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

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          restorePointerInteraction()
        }
      }}
    >
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display font-black">
            Reorganiser les exercices
          </SheetTitle>
          <SheetDescription>
            Glissez les exercices pour changer leur ordre dans la séance.
          </SheetDescription>
        </SheetHeader>
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
            <div className="space-y-2 overflow-y-auto px-4 pb-6">
              {exercises.map((exercise, index) => (
                <ReorderItem key={exercise.exerciseId} exercise={exercise} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </SheetContent>
    </Sheet>
  )
}
