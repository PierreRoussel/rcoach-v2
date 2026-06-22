import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  createTemplateSet,
  type TemplateExerciseDraft,
  type TemplateSetDraft,
} from '@/hooks/useWorkoutTemplates'

type TemplateExerciseSetsEditorProps = {
  exercise: TemplateExerciseDraft
  defaultRestSeconds: number
  onChange: (exercise: TemplateExerciseDraft) => void
}

export function TemplateExerciseSetsEditor({
  exercise,
  defaultRestSeconds,
  onChange,
}: TemplateExerciseSetsEditorProps) {
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

  function handleAddSet() {
    updateSets([
      ...exercise.sets,
      createTemplateSet(exercise.sets.length, defaultRestSeconds),
    ])
  }

  function handleRemoveSet(index: number) {
    updateSets(
      exercise.sets
        .filter((_, setIndex) => setIndex !== index)
        .map((set, setIndex) => ({ ...set, setIndex })),
    )
  }

  if (exercise.sets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">Aucune serie planifiee.</p>
        <Button variant="soft" size="sm" className="mt-3" onClick={handleAddSet}>
          <Plus className="size-4" />
          Ajouter une serie
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 px-1 text-xs font-semibold text-muted-foreground">
        <span>#</span>
        <span>kg</span>
        <span>reps</span>
        <span>repos</span>
        <span />
      </div>
      {exercise.sets.map((set, index) => (
        <div
          key={set.setIndex}
          className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-center gap-2"
        >
          <span className="font-data text-xs text-muted-foreground">{index + 1}</span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="—"
            value={set.weightKg ?? ''}
            onChange={(event) =>
              updateSet(index, {
                weightKg: event.target.value ? Number(event.target.value) : null,
              })
            }
            className="h-8"
          />
          <Input
            type="number"
            inputMode="numeric"
            placeholder="—"
            value={set.reps ?? ''}
            onChange={(event) =>
              updateSet(index, {
                reps: event.target.value ? Number(event.target.value) : null,
              })
            }
            className="h-8"
          />
          <Input
            type="number"
            inputMode="numeric"
            value={set.usesGlobalRest ? defaultRestSeconds : set.restSeconds}
            onChange={(event) => {
              const value = Number(event.target.value) || defaultRestSeconds
              updateSet(index, {
                restSeconds: value,
                usesGlobalRest: value === defaultRestSeconds,
              })
            }}
            onFocus={() => {
              if (set.usesGlobalRest) {
                updateSet(index, { usesGlobalRest: false })
              }
            }}
            className={cn(
              'h-8',
              set.usesGlobalRest && 'text-muted-foreground opacity-60',
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => handleRemoveSet(index)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="mt-2" onClick={handleAddSet}>
        <Plus className="size-4" />
        Serie
      </Button>
    </div>
  )
}
