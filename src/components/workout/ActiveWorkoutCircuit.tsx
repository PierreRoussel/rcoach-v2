import { Check, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ActiveSetOptionsDrawer } from '@/components/workout/ActiveSetOptionsDrawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { buildExerciseUnits } from '@/lib/workout/exercise-units'
import type { ActiveExerciseEntry, ActiveSet } from '@/lib/workout/active-store'
import { buildCircuitSteps, stepKey } from '@/lib/workout/workout-circuit'

const SUPERSET_ACCENTS = [
  'border-primary/60 bg-primary/5',
  'border-secondary/60 bg-secondary/10',
  'border-accent/60 bg-accent/10',
] as const

function supersetAccentClass(supersetId: number) {
  return SUPERSET_ACCENTS[(supersetId - 1) % SUPERSET_ACCENTS.length]
}

type ActiveWorkoutCircuitProps = {
  exercises: ActiveExerciseEntry[]
  activeStepIndex: number
  rpeEnabled: boolean
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
  onCompleteCurrentStep: () => void
  onCompleteStep: (exerciseIndex: number, setIndex: number) => void
  onAddPlannedSet: (exerciseIndex: number) => void
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void
  onReorderSets: (exerciseIndex: number, fromIndex: number, toIndex: number) => void
}

export function ActiveWorkoutCircuit({
  exercises,
  activeStepIndex,
  rpeEnabled,
  onUpdateSet,
  onCompleteCurrentStep,
  onCompleteStep,
  onAddPlannedSet,
  onDeleteSet,
  onReorderSets,
}: ActiveWorkoutCircuitProps) {
  const steps = buildCircuitSteps(exercises)
  const currentStep = steps[activeStepIndex] ?? null
  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const units = buildExerciseUnits(exercises)
  const [setOptions, setSetOptions] = useState<{
    exerciseIndex: number
    setIndex: number
  } | null>(null)

  const selectedExercise =
    setOptions != null ? exercises[setOptions.exerciseIndex] ?? null : null

  useEffect(() => {
    if (!currentStep) {
      return
    }

    const node = stepRefs.current.get(stepKey(currentStep))
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeStepIndex, currentStep])

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ajoutez des exercices pour demarrer le circuit.
      </p>
    )
  }

  function renderSetRow(exerciseIndex: number, setIndex: number) {
    const exercise = exercises[exerciseIndex]
    const set = exercise?.sets[setIndex]
    if (!exercise || !set) {
      return null
    }

    const globalStepIndex = steps.findIndex(
      (step) => step.exerciseIndex === exerciseIndex && step.setIndex === setIndex,
    )
    const isCurrent = globalStepIndex === activeStepIndex
    const isCompleted = Boolean(set.completedAt)

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
          isCurrent
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
              'flex size-7 shrink-0 items-center justify-center rounded-full font-data text-xs font-bold',
              set.setType === 'warmup'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'bg-muted text-foreground',
            )}
            aria-label={`Options serie ${setIndex + 1}`}
            onClick={() => setSetOptions({ exerciseIndex, setIndex })}
          >
            {isCompleted ? (
              <Check className="size-3.5 text-primary" />
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
            <Input
              inputMode="decimal"
              placeholder="RPE"
              value={set.rpe ?? ''}
              disabled={isCompleted}
              className="h-9 w-11 shrink-0 px-1 text-center text-sm font-data"
              onChange={(event) =>
                onUpdateSet(exerciseIndex, setIndex, {
                  rpe: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          ) : null}

          {!isCompleted ? (
            <Button
              type="button"
              size="icon"
              variant="pill"
              className="size-8 shrink-0 rounded-full"
              aria-label="Valider la serie"
              onClick={() =>
                isCurrent
                  ? onCompleteCurrentStep()
                  : onCompleteStep(exerciseIndex, setIndex)
              }
            >
              <Check className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  function renderExerciseBlock(exerciseIndex: number) {
    const exercise = exercises[exerciseIndex]
    if (!exercise) {
      return null
    }

    return (
      <div key={exercise.exerciseId} className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display font-black">{exercise.exerciseName}</p>
            <p className="text-xs text-muted-foreground">
              {exercise.muscleGroup ?? exercise.equipment ?? '—'}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => onAddPlannedSet(exerciseIndex)}
          >
            <Plus className="size-3.5" />
            Serie
          </Button>
        </div>

        <div className="space-y-2">
          {exercise.sets.map((set) => renderSetRow(exerciseIndex, set.setIndex))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {units.map((unit) => {
          if (unit.type === 'single') {
            return renderExerciseBlock(unit.index)
          }

          return (
            <div
              key={`superset-${unit.supersetId}-${unit.indices[0]}`}
              className={cn(
                'space-y-3 rounded-2xl border-2 border-dashed p-3',
                supersetAccentClass(unit.supersetId),
              )}
            >
              <p className="font-data text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Superset {unit.supersetId}
              </p>
              {unit.indices.map((exerciseIndex) => renderExerciseBlock(exerciseIndex))}
            </div>
          )
        })}
      </div>

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
