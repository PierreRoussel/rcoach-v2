import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ActiveSetOptionsDrawer } from '@/components/workout/ActiveSetOptionsDrawer'
import { ExerciseReorderDrawer } from '@/components/workout/ExerciseReorderDrawer'
import { RpeSelect } from '@/components/workout/RpeSelect'
import { SortableExerciseList } from '@/components/workout/SortableExerciseList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ActiveExerciseEntry, ActiveSet } from '@/lib/workout/active-store'
import {
  buildCircuitSteps,
  findNextStepIndexAfter,
  stepKey,
  type CircuitStep,
} from '@/lib/workout/workout-circuit'

type ActiveWorkoutCircuitProps = {
  exercises: ActiveExerciseEntry[]
  lastCompletedStep: CircuitStep | null
  rpeEnabled: boolean
  onSelectExercise: (exerciseIndex: number) => void
  onReorderExercises: (fromIndex: number, toIndex: number) => void
  onRemoveExercise: (exerciseIndex: number) => void
  onAddToSuperset: (fromIndex: number, partnerIndex: number) => void
  onRemoveFromSuperset: (exerciseIndex: number) => void
  onUpdateExerciseRest: (exerciseIndex: number, restSeconds: number) => void
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    patch: {
      weightKg?: number | null
      reps?: number | null
      rpe?: number | null
      setType?: ActiveSet['setType']
    },
  ) => void
  onCompleteStep: (exerciseIndex: number, setIndex: number) => void
  onUncompleteStep: (exerciseIndex: number, setIndex: number) => void
  onAddPlannedSet: (exerciseIndex: number) => void
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void
  onReorderSets: (exerciseIndex: number, fromIndex: number, toIndex: number) => void
}

export function ActiveWorkoutCircuit({
  exercises,
  lastCompletedStep,
  rpeEnabled,
  onSelectExercise,
  onReorderExercises,
  onRemoveExercise,
  onAddToSuperset,
  onRemoveFromSuperset,
  onUpdateExerciseRest,
  onUpdateSet,
  onCompleteStep,
  onUncompleteStep,
  onAddPlannedSet,
  onDeleteSet,
  onReorderSets,
}: ActiveWorkoutCircuitProps) {
  const steps = buildCircuitSteps(exercises)
  const nextPendingStepIndex = findNextStepIndexAfter(steps, exercises, lastCompletedStep)
  const targetStep =
    nextPendingStepIndex != null ? steps[nextPendingStepIndex] ?? null : null
  const activeExerciseIndex = targetStep?.exerciseIndex ?? 0
  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const hasAutoScrolledRef = useRef(false)
  const [reorderOpen, setReorderOpen] = useState(false)
  const [setOptions, setSetOptions] = useState<{
    exerciseIndex: number
    setIndex: number
  } | null>(null)

  const selectedExercise =
    setOptions != null ? exercises[setOptions.exerciseIndex] ?? null : null

  useEffect(() => {
    if (!targetStep || hasAutoScrolledRef.current) {
      return
    }

    const node = stepRefs.current.get(stepKey(targetStep))
    if (!node) {
      return
    }

    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    hasAutoScrolledRef.current = true
  }, [nextPendingStepIndex, targetStep])

  function renderSetRow(exerciseIndex: number, setIndex: number) {
    const exercise = exercises[exerciseIndex]
    const set = exercise?.sets[setIndex]
    if (!exercise || !set) {
      return null
    }

    const globalStepIndex = steps.findIndex(
      (step) => step.exerciseIndex === exerciseIndex && step.setIndex === setIndex,
    )
    const isCompleted = Boolean(set.completedAt)
    const isNextToDo = globalStepIndex === nextPendingStepIndex && !isCompleted

    return (
      <div
        key={`${exerciseIndex}-${setIndex}`}
        ref={(node) => {
          if (node) {
            stepRefs.current.set(`${exerciseIndex}:${setIndex}`, node)
          }
        }}
        className={cn(
          'w-full rounded-xl border px-2 py-2 transition-colors',
          isNextToDo
            ? 'border-primary bg-soft-primary/50 ring-1 ring-primary/30'
            : isCompleted
              ? 'border-border/60 bg-muted/20 opacity-80'
              : 'border-border bg-card',
        )}
      >
        <div className="flex w-full items-center gap-1.5">
          <button
            type="button"
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full font-data text-xs font-bold transition-colors',
              isCompleted
                ? 'cursor-pointer bg-primary/15 text-primary hover:bg-primary/25'
                : set.setType === 'warmup'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : 'bg-muted text-foreground',
            )}
            aria-label={
              isCompleted
                ? `Dévalider la série ${setIndex + 1}`
                : `Options série ${setIndex + 1}`
            }
            onClick={() =>
              isCompleted
                ? onUncompleteStep(exerciseIndex, setIndex)
                : setSetOptions({ exerciseIndex, setIndex })
            }
          >
            {isCompleted ? (
              <Check className="size-3.5" />
            ) : set.setType === 'warmup' ? (
              'W'
            ) : (
              setIndex + 1
            )}
          </button>

          <Input
            inputMode="decimal"
            placeholder="kg"
            value={set.weightKg ?? ''}
            disabled={isCompleted}
            className="h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data"
            onChange={(event) =>
              onUpdateSet(exerciseIndex, setIndex, {
                weightKg: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
          <Input
            inputMode="numeric"
            placeholder="reps"
            value={set.reps ?? ''}
            disabled={isCompleted}
            className="h-9 min-w-0 flex-1 basis-0 px-2 text-center text-sm font-data"
            onChange={(event) =>
              onUpdateSet(exerciseIndex, setIndex, {
                reps: event.target.value ? Number(event.target.value) : null,
              })
            }
          />

          {rpeEnabled ? (
            <RpeSelect
              value={set.rpe}
              disabled={isCompleted}
              onChange={(rpe) =>
                onUpdateSet(exerciseIndex, setIndex, { rpe })
              }
            />
          ) : null}

          {!isCompleted ? (
            <Button
              type="button"
              size="icon"
              variant={isNextToDo ? 'pill' : 'ghost'}
              className={cn(
                'size-8 shrink-0 rounded-full',
                !isNextToDo && 'text-muted-foreground hover:text-foreground',
              )}
              aria-label="Valider la serie"
              onClick={() => onCompleteStep(exerciseIndex, setIndex)}
            >
              <Check className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      <SortableExerciseList
        exercises={exercises}
        activeIndex={activeExerciseIndex}
        onSelect={onSelectExercise}
        onReorder={onReorderExercises}
        onRemove={onRemoveExercise}
        onAddToSuperset={onAddToSuperset}
        onRemoveFromSuperset={onRemoveFromSuperset}
        onOpenReorder={() => setReorderOpen(true)}
        onAddSet={onAddPlannedSet}
        showSetCount={false}
        dragHandle="subtle"
        showDeleteButton={false}
        embedded
        renderBelowTitle={(index) => {
          const exercise = exercises[index]
          if (!exercise) {
            return null
          }

          return (
            <div
              className="mt-1 flex items-center gap-2"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Label
                htmlFor={`rest-${exercise.exerciseId}`}
                className="shrink-0 text-xs text-muted-foreground"
              >
                Repos
              </Label>
              <Input
                id={`rest-${exercise.exerciseId}`}
                type="number"
                min={0}
                value={exercise.defaultRestSeconds ?? 90}
                onChange={(event) =>
                  onUpdateExerciseRest(index, Number(event.target.value) || 0)
                }
                className="h-8 w-16 px-2 text-center text-sm font-data"
              />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          )
        }}
        renderSetsContent={(index) => (
          <div className="space-y-2 px-4">
            {exercises[index]?.sets.map((set) => renderSetRow(index, set.setIndex))}
          </div>
        )}
      />

      <ExerciseReorderDrawer
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        exercises={exercises}
        onReorder={onReorderExercises}
      />

      <ActiveSetOptionsDrawer
        open={setOptions != null}
        onOpenChange={(open) => {
          if (!open) {
            setSetOptions(null)
          }
        }}
        exercise={selectedExercise}
        exerciseIndex={setOptions?.exerciseIndex ?? null}
        selectedSetIndex={setOptions?.setIndex ?? null}
        onDeleteSet={onDeleteSet}
        onReorderSets={onReorderSets}
        onUpdateSetType={(exerciseIndex, setIndex, setType) =>
          onUpdateSet(exerciseIndex, setIndex, { setType })
        }
      />
    </>
  )
}
