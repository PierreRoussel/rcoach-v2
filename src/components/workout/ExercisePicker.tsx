import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'

import { CreateExerciseDialog } from '@/components/workout/CreateExerciseDialog'
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
import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { filterExercises, useAllExercises } from '@/hooks/useExercises'
import type { Exercise } from '@/lib/graphql/operations'
import { MUSCLE_GROUPS } from '@/lib/workout/exercise-meta'

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void
  excludeIds?: string[]
  triggerLabel?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  dialogTitle?: string
  dialogDescription?: string
}

export function ExercisePicker({
  onSelect,
  excludeIds = [],
  triggerLabel = 'Ajouter un exercice',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
  dialogTitle = 'Catalogue',
  dialogDescription,
}: ExercisePickerProps) {
  const { data: exercises = [], isLoading } = useAllExercises()
  const [internalOpen, setInternalOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<string>('all')

  const available = useMemo(
    () =>
      filterExercises(exercises, query, muscleGroup).filter(
        (e) => !excludeIds.includes(e.id),
      ),
    [exercises, query, muscleGroup, excludeIds],
  )

  function openCreateDialog() {
    setCreateOpen(true)
  }

  function handleExerciseCreated(exercise: Exercise) {
    setMuscleGroup('all')
    setQuery(exercise.name)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {!hideTrigger ? (
          <DialogTrigger asChild>
            <Button type="button" variant="soft" className="rounded-full">
              <Plus className="size-4" />
              {triggerLabel}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display font-black">{dialogTitle}</DialogTitle>
            {dialogDescription ? (
              <DialogDescription>{dialogDescription}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  className="rounded-xl pl-9"
                  placeholder="Nom, muscle, equipement..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="pill"
                size="icon"
                className="size-9 shrink-0 rounded-xl"
                aria-label="Ajouter un exercice"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
              </Button>
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
                <div className="space-y-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">Aucun exercice trouve.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={openCreateDialog}
                  >
                    <Plus className="size-4" />
                    Ajouter un exercice
                  </Button>
                </div>
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
                    <span className="block font-medium">
                      <DisplayExerciseName
                        name={exercise.name}
                        nameFr={exercise.name_fr}
                        exerciseId={exercise.id}
                      />
                    </span>
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

      <CreateExerciseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialName={query}
        onCreated={handleExerciseCreated}
      />
    </>
  )
}
