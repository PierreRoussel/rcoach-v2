import { Check, Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { buildExerciseUnits } from '@/lib/workout/exercise-units'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'
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
    patch: { weightKg?: number | null; reps?: number | null; rpe?: number | null },
  ) => void
  onCompleteCurrentStep: () => void
  onAddPlannedSet: (exerciseIndex: number) => void
  onGoToStep: (stepIndex: number) => void
}

export function ActiveWorkoutCircuit({
  exercises,
  activeStepIndex,
  rpeEnabled,
  onUpdateSet,
  onCompleteCurrentStep,
  onAddPlannedSet,
  onGoToStep,
}: ActiveWorkoutCircuitProps) {
  const steps = buildCircuitSteps(exercises)
  const currentStep = steps[activeStepIndex] ?? null
  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const units = buildExerciseUnits(exercises)

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
          'rounded-xl border px-3 py-2 transition-colors',
          isCurrent
            ? 'border-primary bg-soft-primary/50 ring-1 ring-primary/30'
            : isCompleted
              ? 'border-border/60 bg-muted/20 opacity-80'
              : 'border-border bg-card',
        )}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-data text-xs font-bold"
            onClick={() => {
              if (globalStepIndex >= 0) {
                onGoToStep(globalStepIndex)
              }
            }}
          >
            {isCompleted ? <Check className="size-4 text-primary" /> : setIndex + 1}
          </button>

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <Input
              inputMode="decimal"
              placeholder="kg"
              value={set.weightKg ?? ''}
              disabled={isCompleted && !isCurrent}
              className="h-8 text-sm"
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
              disabled={isCompleted && !isCurrent}
              className="h-8 text-sm"
              onChange={(event) =>
                onUpdateSet(exerciseIndex, setIndex, {
                  reps: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </div>

          {rpeEnabled ? (
            <Input
              inputMode="decimal"
              placeholder="RPE"
              value={set.rpe ?? ''}
              disabled={isCompleted && !isCurrent}
              className="h-8 w-14 text-sm"
              onChange={(event) =>
                onUpdateSet(exerciseIndex, setIndex, {
                  rpe: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          ) : null}

          {isCurrent ? (
            <Button
              type="button"
              size="sm"
              variant="pill"
              className="shrink-0 rounded-full"
              onClick={onCompleteCurrentStep}
            >
              Valider
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
  )
}
