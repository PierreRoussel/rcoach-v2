import { useRef, useState } from 'react'

import { LastSetPerformanceHint } from '@/components/workout/LastSetPerformanceHint'
import { ExerciseOverloadHint } from '@/components/workout/ExerciseOverloadHint'
import { SetOptionsDrawer } from '@/components/workout/SetOptionsDrawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  reindexTemplateSets,
  type TemplateExerciseDraft,
  type TemplateSetDraft,
} from '@/hooks/useWorkoutTemplates'
import { useLastTemplateSetHistory } from '@/hooks/useLastTemplateSetHistory'
import { cn } from '@/lib/utils'
import { applyOverloadToWorkingSets } from '@/lib/workout/progressive-overload'
import { getLastSetSummary } from '@/lib/workout/template-set-history'

type TemplateExerciseSetsEditorProps = {
  exercise: TemplateExerciseDraft
  templateId?: string
  includeRpeInHistory?: boolean
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
  templateId,
  includeRpeInHistory = true,
  onChange,
}: TemplateExerciseSetsEditorProps) {
  const [propagatePrompt, setPropagatePrompt] = useState<PropagatePrompt | null>(
    null,
  )
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(null)
  const focusSnapshot = useRef<FocusSnapshot | null>(null)
  const { history: templateSetHistory } = useLastTemplateSetHistory(templateId, {
    includeRpe: includeRpeInHistory,
  })
  const showLastColumn = Boolean(templateId)

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
    <div className="flex w-full items-center gap-2 px-3">
      <Label htmlFor={`defaultRest-${exercise.exerciseId}`} className="shrink-0 text-sm">
        Repos par défaut
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
        <div className="px-3">
          <ExerciseOverloadHint
            compact
            exercise={{
              id: exercise.exerciseId,
              name: exercise.exerciseName,
              equipment: exercise.equipment,
            }}
            onApply={(suggestion) =>
              onChange({
                ...exercise,
                sets: applyOverloadToWorkingSets(exercise.sets, suggestion),
              })
            }
          />
        </div>
        <div className="mx-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucune série planifiée.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {defaultRestControl}
      <div className="px-3">
        <ExerciseOverloadHint
          compact
          exercise={{
            id: exercise.exerciseId,
            name: exercise.exerciseName,
            equipment: exercise.equipment,
          }}
          onApply={(suggestion) =>
            onChange({
              ...exercise,
              sets: applyOverloadToWorkingSets(exercise.sets, suggestion),
            })
          }
        />
      </div>
      <div className="space-y-0">
        <div
          className={cn(
            'grid w-full gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
            showLastColumn
              ? 'grid-cols-[2rem_minmax(4.25rem,0.9fr)_1fr_1fr_1fr]'
              : 'grid-cols-[2rem_1fr_1fr_1fr]',
          )}
        >
          <span>#</span>
          {showLastColumn ? <span>Dern.</span> : null}
          <span>kg</span>
          <span>reps</span>
          <span>repos</span>
        </div>
        {exercise.sets.map((set, index) => (
          <div key={set.setIndex} className="w-full space-y-1">
            <div className="w-full border-b border-border/60 bg-card px-3 py-2 last:border-b-0">
              <div className="flex w-full min-w-0 items-center gap-1">
                <button
                  type="button"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full font-data text-xs font-bold',
                    set.setType === 'warmup'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : 'bg-muted text-foreground',
                  )}
                  aria-label={`Options série ${index + 1}`}
                  onClick={() => setSelectedSetIndex(index)}
                >
                  {set.setType === 'warmup' ? 'W' : index + 1}
                </button>
                {showLastColumn ? (
                  <div className="min-w-[4.25rem] max-w-[5.5rem] shrink-0 basis-[22%]">
                    <LastSetPerformanceHint
                      summary={getLastSetSummary(
                        templateSetHistory,
                        exercise.exerciseId,
                        set.setIndex,
                      )}
                    />
                  </div>
                ) : null}
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
              <div className="mx-3 flex flex-wrap items-center gap-2 rounded-lg bg-soft-secondary/50 px-2 py-1.5 text-xs">
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
