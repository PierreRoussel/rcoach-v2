import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Pill } from '@/design-system'
import { filterExercises, useAllExercises } from '@/hooks/useExercises'
import type { Exercise } from '@/lib/graphql/operations'
import { MUSCLE_GROUPS } from '@/lib/workout/exercise-meta'

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void
  excludeIds?: string[]
  triggerLabel?: string
}

export function ExercisePicker({
  onSelect,
  excludeIds = [],
  triggerLabel = 'Ajouter un exercice',
}: ExercisePickerProps) {
  const { data: exercises = [], isLoading } = useAllExercises()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<string>('all')

  const available = useMemo(
    () => filterExercises(exercises, query, muscleGroup).filter((e) => !excludeIds.includes(e.id)),
    [exercises, query, muscleGroup, excludeIds],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="soft" className="rounded-full">
          <Plus className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display font-black">Catalogue</DialogTitle>
          <DialogDescription>
            Recherchez un exercice public ou personnel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              className="rounded-xl pl-9"
              placeholder="Nom, muscle, equipement..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMuscleGroup('all')}
              className={muscleGroup === 'all' ? 'opacity-100' : 'opacity-60'}
            >
              <Pill tone={muscleGroup === 'all' ? 'primary' : 'default'}>Tous</Pill>
            </button>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setMuscleGroup(group)}
                className={muscleGroup === group ? 'opacity-100' : 'opacity-60'}
              >
                <Pill tone={muscleGroup === group ? 'secondary' : 'default'}>{group}</Pill>
              </button>
            ))}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : null}
            {!isLoading && available.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun exercice trouve.</p>
            ) : null}
            {available.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-3 py-2 text-left hover:bg-soft-primary/40"
                onClick={() => {
                  onSelect(exercise)
                  setOpen(false)
                  setQuery('')
                }}
              >
                <span>
                  <span className="block font-medium">{exercise.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {exercise.muscle_group ?? '—'} · {exercise.equipment ?? '—'}
                  </span>
                </span>
                {!exercise.is_public ? (
                  <Pill tone="purple">Perso</Pill>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
