import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'

import { SetOptionsDrawer } from '@/components/workout/SetOptionsDrawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  createTemplateSet,
  inheritSetValues,
  reindexTemplateSets,
  type TemplateExerciseDraft,
  type TemplateSetDraft,
} from '@/hooks/useWorkoutTemplates'

type TemplateExerciseSetsEditorProps = {
  exercise: TemplateExerciseDraft
  onChange: (exercise: TemplateExerciseDraft) => void
}

type PropagateField = 'weightKg' | 'reps'

type PropagatePrompt = {
  setIndex: number
  field: PropagateField
  value: number
}

type FocusSnapshot = {
  setIndex: number
  field: PropagateField
  value: number | null
}

export function TemplateExerciseSetsEditor({
  exercise,
  onChange,
}: TemplateExerciseSetsEditorProps) {
  const [propagatePrompt, setPropagatePrompt] = useState<PropagatePrompt | null>(
    null,
  )
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null)
  const focusSnapshot = useRef<FocusSnapshot | null>(null)

  function updateSets(nextSets: TemplateSetDraft[]) {
    onChange({ ...exercise, sets: nextSets })
  }

  function updateSet(index: number, patch: Partial<TemplateSetDraft>) {
    updateSets(
      exercise.sets.map((set, setIndex) =>
        setIndex === index ? { ...set, ...patch } : set,
      ),
    )
  }

  function handleDefaultRestChange(value: number) {
    const next = Math.max(0, value)
    onChange({
      ...exercise,
      defaultRestSeconds: next,
      sets: exercise.sets.map((set) =>
        set.usesGlobalRest ? { ...set, restSeconds: next } : set,
      ),
    })
  }

  function handleAddSet() {
    const inherited = inheritSetValues(exercise.sets)
    updateSets([
      ...exercise.sets,
      createTemplateSet(
        exercise.sets.length,
        exercise.defaultRestSeconds,
        inherited,
      ),
    ])
  }

  function handleRemoveSet(setIndex: number) {
    setPropagatePrompt(null)
    if (exercise.sets.length <= 1) {
      return
    }

    updateSets(
      reindexTemplateSets(
        exercise.sets.filter((set) => set.setIndex !== setIndex),
      ),
    )
  }

  function handleReorderSets(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return
    }

    const sets = [...exercise.sets]
    const [moved] = sets.splice(fromIndex, 1)
    if (!moved) {
      return
    }

    sets.splice(toIndex, 0, moved)
    updateSets(reindexTemplateSets(sets))
  }

  function handleUpdateSetType(
    setIndex: number,
    setType: NonNullable<TemplateSetDraft['setType']>,
  ) {
    updateSets(
      exercise.sets.map((set) =>
        set.setIndex === setIndex ? { ...set, setType } : set,
      ),
    )
  }

  function handleFieldFocus(
    setIndex: number,
    field: PropagateField,
    value: number | null,
  ) {
    focusSnapshot.current = { setIndex, field, value }
    if (propagatePrompt?.setIndex === setIndex && propagatePrompt.field === field) {
      return
    }
    setPropagatePrompt(null)
  }

  function handleFieldBlur(
    setIndex: number,
    field: PropagateField,
    value: number | null,
  ) {
    const snapshot = focusSnapshot.current
    focusSnapshot.current = null

    if (
      !snapshot ||
      snapshot.setIndex !== setIndex ||
      snapshot.field !== field ||
      snapshot.value === value
    ) {
      return
    }

    if (value == null || exercise.sets.length <= 1) {
      setPropagatePrompt(null)
      return
    }

    const othersDiffer = exercise.sets.some(
      (set, index) => index !== setIndex && set[field] !== value,
    )

    if (othersDiffer) {
      setPropagatePrompt({ setIndex, field, value })
    }
  }

  function handleApplyPropagate() {
    if (!propagatePrompt) {
      return
    }

    const { field, value } = propagatePrompt
    updateSets(
      exercise.sets.map((set) => ({
        ...set,
        [field]: value,
      })),
    )
    setPropagatePrompt(null)
  }

  function formatPropagateMessage(prompt: PropagatePrompt) {
    if (prompt.field === 'weightKg') {
      return `Appliquer ${prompt.value} kg à toutes les séries ?`
    }

    return `Appliquer ${prompt.value} reps à toutes les séries ?`
  }

  const defaultRestControl = (
    <div className="flex w-full max-w-xs items-center gap-2 px-4">
      <Label htmlFor={`defaultRest-${exercise.exerciseId}`} className="shrink-0 text-sm">
        Repos par defaut
      </Label>
      <Input
        id={`defaultRest-${exercise.exerciseId}`}
        type="number"
        min={0}
        value={exercise.defaultRestSeconds}
        onChange={(event) =>
          handleDefaultRestChange(Number(event.target.value) || 0)
        }
        className="h-8"
      />
      <span className="text-xs text-muted-foreground">s</span>
    </div>
  )

  if (exercise.sets.length === 0) {
    return (
      <div className="space-y-3">
        {defaultRestControl}
        <div className="mx-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucune serie planifiee.</p>
          <Button variant="soft" size="sm" className="mt-3" onClick={handleAddSet}>
            <Plus className="size-4" />
            Ajouter une serie
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {defaultRestControl}
      <div className="space-y-2">
        <div className="grid w-full grid-cols-[2rem_1fr_1fr_1fr] gap-2 px-4 text-xs font-semibold text-muted-foreground">
          <span>#</span>
          <span>kg</span>
          <span>reps</span>
          <span>repos</span>
        </div>
        {exercise.sets.map((set, index) => (
          <div key={set.setIndex} className="w-full space-y-1">
            <div className="w-full rounded-xl border border-border bg-card px-4 py-2">
              <div className="flex w-full items-center gap-1.5">
                <button
                  type="button"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full font-data text-xs font-bold',
                    set.setType === 'warmup'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-muted text-foreground',
                  )}
                  aria-label={`Options serie ${index + 1}`}
                  onClick={() => setSelectedSetIndex(index)}
                >
                  {set.setType === 'warmup' ? 'W' : index + 1}
                </button>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="—"
                  value={set.weightKg ?? ''}
                  onFocus={() => handleFieldFocus(index, 'weightKg', set.weightKg)}
                  onChange={(event) =>
                    updateSet(index, {
                      weightKg: event.target.value
                        ? Number(event.target.value)
                        : null,
                    })
                  }
                  onBlur={(event) =>
                    handleFieldBlur(
                      index,
                      'weightKg',
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  className="h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  value={set.reps ?? ''}
                  onFocus={() => handleFieldFocus(index, 'reps', set.reps)}
                  onChange={(event) =>
                    updateSet(index, {
                      reps: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  onBlur={(event) =>
                    handleFieldBlur(
                      index,
                      'reps',
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  className="h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={
                    set.usesGlobalRest
                      ? exercise.defaultRestSeconds
                      : set.restSeconds
                  }
                  onChange={(event) => {
                    const value =
                      Number(event.target.value) || exercise.defaultRestSeconds
                    updateSet(index, {
                      restSeconds: value,
                      usesGlobalRest: value === exercise.defaultRestSeconds,
                    })
                  }}
                  onFocus={() => {
                    if (set.usesGlobalRest) {
                      updateSet(index, { usesGlobalRest: false })
                    }
                  }}
                  className={cn(
                    'h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data',
                    set.usesGlobalRest && 'text-muted-foreground opacity-60',
                  )}
                />
              </div>
            </div>
            {propagatePrompt?.setIndex === index ? (
              <div className="mx-4 flex flex-wrap items-center gap-2 rounded-lg bg-soft-secondary/50 px-2 py-1.5 text-xs">
                <span>{formatPropagateMessage(propagatePrompt)}</span>
                <button
                  type="button"
                  className="font-semibold text-primary underline-offset-2 hover:underline"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleApplyPropagate}
                >
                  Valider
                </button>
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-2 hover:underline"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setPropagatePrompt(null)}
                >
                  Ignorer
                </button>
              </div>
            ) : null}
          </div>
        ))}
        <div className="px-4">
          <Button variant="outline" size="sm" className="mt-2" onClick={handleAddSet}>
            <Plus className="size-4" />
            Serie
          </Button>
        </div>
      </div>

      <SetOptionsDrawer
        open={selectedSetIndex != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSetIndex(null)
          }
        }}
        exerciseName={exercise.exerciseName}
        sets={exercise.sets}
        selectedSetIndex={selectedSetIndex}
        onDeleteSet={handleRemoveSet}
        onReorderSets={handleReorderSets}
        onUpdateSetType={handleUpdateSetType}
      />
    </div>
  )
}
