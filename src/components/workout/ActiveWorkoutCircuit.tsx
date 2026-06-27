import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ActiveSetOptionsDrawer } from '@/components/workout/ActiveSetOptionsDrawer'
import { ExerciseOverloadHint } from '@/components/workout/ExerciseOverloadHint'
import { ExerciseReorderDrawer } from '@/components/workout/ExerciseReorderDrawer'
import { LastSetPerformanceHint } from '@/components/workout/LastSetPerformanceHint'
import { RpeSelect } from '@/components/workout/RpeSelect'
import { SortableExerciseList } from '@/components/workout/SortableExerciseList'
import {
  ExerciseStatsDrawer,
  type ExerciseStatsDrawerTarget,
} from '@/components/stats/ExerciseStatsDrawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RestSecondsInput } from '@/components/workout/RestSecondsInput'
import {
  getSetPerformanceColumnLabels,
  SetPerformanceInputs,
} from '@/components/workout/SetPerformanceInputs'
import { cn } from '@/lib/utils'
import type { ActiveExerciseEntry, ActiveSet } from '@/lib/workout/active-store'
import { getExerciseTrackingKind } from '@/lib/workout/exercise-tracking'
import {
  buildCircuitSteps,
  findNextStepIndexAfter,
  stepKey,
  type CircuitStep,
} from '@/lib/workout/workout-circuit'
import {
  getLastSetSummary,
  type TemplateSetHistory,
} from '@/lib/workout/template-set-history'
import type { OverloadSuggestion } from '@/lib/workout/progressive-overload'
import { scrollElementIntoViewWhenReady } from '@/lib/stats/scroll-to-featured'

type ActiveWorkoutCircuitProps = {
  exercises: ActiveExerciseEntry[]
  lastCompletedStep: CircuitStep | null
  workoutStartedAt: string | null
  rpeEnabled: boolean
  showLastSetColumn?: boolean
  templateSetHistory?: TemplateSetHistory
  onSelectExercise: (exerciseIndex: number) => void
  onReorderExercises: (fromIndex: number, toIndex: number) => void
  onRemoveExercise: (exerciseIndex: number) => void
  onReplaceExercise: (exerciseIndex: number, exercise: {
    id: string
    name: string
    muscle_group?: string | null
    equipment?: string | null
  }) => void
  onAddToSuperset: (fromIndex: number, partnerIndex: number) => void
  onRemoveFromSuperset: (exerciseIndex: number) => void
  onUpdateExerciseRest: (exerciseIndex: number, restSeconds: number) => void
  onUpdateSet: (
    exerciseIndex: number,
    setIndex: number,
    patch: {
      weightKg?: number | null
      reps?: number | null
      durationSeconds?: number | null
      rpe?: number | null
      setType?: ActiveSet['setType']
    },
  ) => void
  onCompleteStep: (exerciseIndex: number, setIndex: number) => void
  onStartHold: (exerciseIndex: number, setIndex: number) => void
  onUncompleteStep: (exerciseIndex: number, setIndex: number) => void
  onAddPlannedSet: (exerciseIndex: number) => void
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void
  onReorderSets: (exerciseIndex: number, fromIndex: number, toIndex: number) => void
  onApplyOverloadSuggestion?: (
    exerciseIndex: number,
    suggestion: OverloadSuggestion,
  ) => void
}

export function ActiveWorkoutCircuit({
  exercises,
  lastCompletedStep,
  workoutStartedAt,
  rpeEnabled,
  showLastSetColumn = false,
  templateSetHistory,
  onSelectExercise,
  onReorderExercises,
  onRemoveExercise,
  onReplaceExercise,
  onAddToSuperset,
  onRemoveFromSuperset,
  onUpdateExerciseRest,
  onUpdateSet,
  onCompleteStep,
  onStartHold,
  onUncompleteStep,
  onAddPlannedSet,
  onDeleteSet,
  onReorderSets,
  onApplyOverloadSuggestion,
}: ActiveWorkoutCircuitProps) {
  const steps = buildCircuitSteps(exercises)
  const nextPendingStepIndex = findNextStepIndexAfter(steps, exercises, lastCompletedStep)
  const targetStep =
    nextPendingStepIndex != null ? steps[nextPendingStepIndex] ?? null : null
  const activeExerciseIndex = targetStep?.exerciseIndex ?? 0
  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const lastAutoScrolledStepKeyRef = useRef<string | null>(null)
  const [reorderOpen, setReorderOpen] = useState(false)
  const [statsExercise, setStatsExercise] = useState<ExerciseStatsDrawerTarget | null>(
    null,
  )
  const [setOptions, setSetOptions] = useState<{
    exerciseIndex: number
    setIndex: number
  } | null>(null)

  const selectedExercise =
    setOptions != null ? exercises[setOptions.exerciseIndex] ?? null : null

  useEffect(() => {
    lastAutoScrolledStepKeyRef.current = null
  }, [workoutStartedAt])

  useEffect(() => {
    if (!targetStep || exercises.length === 0) {
      return
    }

    const key = stepKey(targetStep)
    if (lastAutoScrolledStepKeyRef.current === key) {
      return
    }

    return scrollElementIntoViewWhenReady(
      () => stepRefs.current.get(key) ?? null,
      {
        behavior: 'smooth',
        block: 'center',
        onScroll: () => {
          lastAutoScrolledStepKeyRef.current = key
        },
      },
    )
  }, [exercises.length, lastCompletedStep, nextPendingStepIndex, targetStep])

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
    const lastSetSummary =
      showLastSetColumn && templateSetHistory
        ? getLastSetSummary(templateSetHistory, exercise.exerciseId, set.setIndex)
        : null
    const trackingKind = getExerciseTrackingKind({
      name: exercise.exerciseName,
      equipment: exercise.equipment ?? null,
    })
    const isTimed = trackingKind === 'timed'

    return (
      <div
        key={`${exerciseIndex}-${setIndex}`}
        ref={(node) => {
          if (node) {
            stepRefs.current.set(`${exerciseIndex}:${setIndex}`, node)
          }
        }}
        className={cn(
          'w-full border-b border-border/60 px-3 py-2 transition-colors last:border-b-0',
          isNextToDo
            ? 'bg-soft-primary/50 ring-1 ring-inset ring-primary/30'
            : isCompleted
              ? 'bg-muted/20 opacity-80'
              : 'bg-card',
        )}
      >
        <div className="flex w-full min-w-0 items-center gap-1">
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

          {showLastSetColumn ? (
            <div className="min-w-[4.25rem] max-w-[5.5rem] shrink-0 basis-[22%]">
              <LastSetPerformanceHint summary={lastSetSummary} />
            </div>
          ) : null}

          <SetPerformanceInputs
            kind={trackingKind}
            variant="inline"
            values={{
              weightKg: set.weightKg,
              reps: set.reps,
              durationSeconds: set.durationSeconds,
            }}
            disabled={isCompleted}
            onChange={(patch) => onUpdateSet(exerciseIndex, setIndex, patch)}
          />

          {rpeEnabled ? (
            <RpeSelect
              variant="inline"
              value={set.rpe}
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
              aria-label={isTimed ? 'Démarrer le maintien' : 'Valider la série'}
              onClick={() =>
                isTimed
                  ? onStartHold(exerciseIndex, setIndex)
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

  return (
    <>
      <SortableExerciseList
        exercises={exercises}
        activeIndex={activeExerciseIndex}
        onSelect={onSelectExercise}
        onReorder={onReorderExercises}
        onRemove={onRemoveExercise}
        onReplace={onReplaceExercise}
        onAddToSuperset={onAddToSuperset}
        onRemoveFromSuperset={onRemoveFromSuperset}
        onOpenReorder={() => setReorderOpen(true)}
        onViewStats={(index) => {
          const exercise = exercises[index]
          if (!exercise) {
            return
          }

          setStatsExercise({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
          })
        }}
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
              <RestSecondsInput
                id={`rest-${exercise.exerciseId}`}
                value={exercise.defaultRestSeconds ?? 90}
                onCommit={(seconds) => onUpdateExerciseRest(index, seconds)}
                className="h-8 w-16 px-2 text-center text-sm font-data"
              />
              <span className="text-xs text-muted-foreground">s</span>
            </div>
          )
        }}
        renderSetsContent={(index) => {
          const exercise = exercises[index]
          if (!exercise) {
            return null
          }

          const trackingKind = getExerciseTrackingKind({
            name: exercise.exerciseName,
            equipment: exercise.equipment ?? null,
          })
          const columnLabels = getSetPerformanceColumnLabels(trackingKind)
          const performanceColumnCount = columnLabels.length

          return (
            <div className="w-full space-y-2 px-4">
              <ExerciseOverloadHint
                compact
                exercise={{
                  id: exercise.exerciseId,
                  name: exercise.exerciseName,
                  equipment: exercise.equipment ?? null,
                }}
                onApply={
                  onApplyOverloadSuggestion
                    ? (suggestion) => onApplyOverloadSuggestion(index, suggestion)
                    : undefined
                }
              />
              <div className="w-full divide-y divide-border/60">
                <div
                  className={cn(
                    'grid w-full gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                    showLastSetColumn
                      ? rpeEnabled
                        ? performanceColumnCount === 1
                          ? 'grid-cols-[2rem_minmax(4.25rem,0.9fr)_1fr_2.5rem_2rem]'
                          : 'grid-cols-[2rem_minmax(4.25rem,0.9fr)_1fr_1fr_2.5rem_2rem]'
                        : performanceColumnCount === 1
                          ? 'grid-cols-[2rem_minmax(4.25rem,0.9fr)_1fr_2rem]'
                          : 'grid-cols-[2rem_minmax(4.25rem,0.9fr)_1fr_1fr_2rem]'
                      : rpeEnabled
                        ? performanceColumnCount === 1
                          ? 'grid-cols-[2rem_1fr_2.5rem_2rem]'
                          : 'grid-cols-[2rem_1fr_1fr_2.5rem_2rem]'
                        : performanceColumnCount === 1
                          ? 'grid-cols-[2rem_1fr_2rem]'
                          : 'grid-cols-[2rem_1fr_1fr_2rem]',
                  )}
                >
                  <span>#</span>
                  {showLastSetColumn ? <span>Dern.</span> : null}
                  {columnLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                  {rpeEnabled ? <span>RPE</span> : null}
                  <span aria-hidden className="sr-only">
                    Valider
                  </span>
                </div>
                {exercise.sets.map((set) => renderSetRow(index, set.setIndex))}
              </div>
            </div>
          )
        }}
      />

      <ExerciseStatsDrawer
        open={statsExercise != null}
        onOpenChange={(open) => {
          if (!open) {
            setStatsExercise(null)
          }
        }}
        exercise={statsExercise}
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
