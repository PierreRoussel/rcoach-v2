import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'

type SortableExerciseListProps = {
  exercises: ActiveExerciseEntry[]
  activeIndex: number
  onSelect: (index: number) => void
  onReorder: (from: number, to: number) => void
  onRemove: (index: number) => void
}

function SortableExerciseItem({
  exercise,
  isActive,
  onSelect,
  onRemove,
}: {
  exercise: ActiveExerciseEntry
  isActive: boolean
  onSelect: () => void
  onRemove: () => void
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
        'flex items-center gap-2 rounded-2xl border px-3 py-2',
        isActive ? 'border-primary bg-soft-primary/60' : 'border-border bg-card',
        isDragging && 'opacity-70 shadow-md',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Reordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <p className="truncate font-display font-black">{exercise.exerciseName}</p>
        <p className="text-xs text-muted-foreground">{exercise.sets.length} sets</p>
      </button>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

export function SortableExerciseList({
  exercises,
  activeIndex,
  onSelect,
  onReorder,
  onRemove,
}: SortableExerciseListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ajoutez des exercices depuis le catalogue.
      </p>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={exercises.map((exercise) => exercise.exerciseId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {exercises.map((exercise, index) => (
            <SortableExerciseItem
              key={exercise.exerciseId}
              exercise={exercise}
              isActive={index === activeIndex}
              onSelect={() => onSelect(index)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
