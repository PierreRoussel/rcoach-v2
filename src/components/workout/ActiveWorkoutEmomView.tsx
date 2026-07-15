import { Check, CircleCheckBig, SkipForward } from 'lucide-react'
import { useMemo, useState } from 'react'

import { DisplayExerciseName } from '@/components/workout/DisplayExerciseName'
import { EmomGroupDrawer } from '@/components/workout/EmomGroupDrawer'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pill } from '@/design-system'
import {
  buildEmomSlots,
  formatEmomSecondsLeft,
  getSlotExerciseIndices,
  getSlotForMinute,
  isEmomComplete,
} from '@/lib/workout/emom-circuit'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { cn } from '@/lib/utils'

export function ActiveWorkoutEmomView() {
  const exercises = useActiveWorkoutStore((state) => state.exercises)
  const emom = useActiveWorkoutStore((state) => state.emom)
  const removeExercise = useActiveWorkoutStore((state) => state.removeExercise)
  const applyEmomGroupMembership = useActiveWorkoutStore(
    (state) => state.applyEmomGroupMembership,
  )
  const updateExerciseTargetReps = useActiveWorkoutStore(
    (state) => state.updateExerciseTargetReps,
  )
  const logEmomMinute = useActiveWorkoutStore((state) => state.logEmomMinute)
  const skipEmomMinute = useActiveWorkoutStore((state) => state.skipEmomMinute)
  const [groupAnchorIndex, setGroupAnchorIndex] = useState<number | null>(null)

  const slots = useMemo(() => buildEmomSlots(exercises), [exercises])
  const isCountdown = emom?.phase === 'countdown'
  const currentSlot = emom && !isCountdown
    ? getSlotForMinute(slots, emom.currentMinuteIndex)
    : null
  const currentExerciseIndices = getSlotExerciseIndices(currentSlot)
  const currentMinuteNumber = (emom?.currentMinuteIndex ?? 0) + 1
  const isComplete = emom
    ? emom.phase === 'complete' || isEmomComplete(emom.currentMinuteIndex, emom.totalMinutes)
    : false
  const isCurrentMinuteLogged = emom
    ? Boolean(emom.minuteLogs[emom.currentMinuteIndex])
    : false

  if (!emom) {
    return null
  }

  const timerLabel = isCountdown
    ? String(emom.countdownSecondsLeft ?? 0)
    : isComplete
      ? '0:00'
      : formatEmomSecondsLeft(emom.secondsLeftInMinute)

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border">
        <CardContent className="space-y-5 px-4 py-6 text-center">
          <div className="space-y-1">
            {isCountdown ? (
              <Pill tone="secondary" className="font-semibold">
                Préparez-vous
              </Pill>
            ) : (
              <Pill tone="secondary" className="font-semibold">
                Minute {Math.min(currentMinuteNumber, emom.totalMinutes)} / {emom.totalMinutes}
              </Pill>
            )}
            {isComplete ? (
              <p className="text-sm text-muted-foreground">Séance EMOM terminée</p>
            ) : isCountdown ? (
              <p className="text-sm text-muted-foreground">Départ dans…</p>
            ) : null}
          </div>

          <div className="mx-auto flex size-36 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
            <span
              className={cn(
                'font-display font-black tabular-nums text-foreground',
                isCountdown ? 'text-6xl' : 'text-4xl',
              )}
            >
              {timerLabel}
            </span>
          </div>

          {!isCountdown && currentExerciseIndices.length > 0 ? (
            <div className="mx-auto max-w-md space-y-3 text-left">
              {currentExerciseIndices.length > 1 ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Cette minute</p>
                  <Pill tone="default">{currentExerciseIndices.length} exercices</Pill>
                </div>
              ) : null}

              <div
                className={cn(
                  'space-y-2 rounded-2xl border border-border bg-muted/20 p-3',
                  currentExerciseIndices.length > 1 && 'border-primary/20 bg-primary/5',
                )}
              >
                {currentExerciseIndices.map((exerciseIndex) => {
                  const exercise = exercises[exerciseIndex]
                  if (!exercise) {
                    return null
                  }

                  return (
                    <div key={exercise.exerciseId} className="space-y-1">
                      <p className="font-display text-lg font-black">
                        <DisplayExerciseName
                          name={exercise.exerciseName}
                          nameFr={exercise.exerciseNameFr}
                          exerciseId={exercise.exerciseId}
                        />
                      </p>
                      {exercise.targetReps != null ? (
                        <p className="text-sm text-muted-foreground">
                          {exercise.targetReps} reps
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : !isCountdown ? (
            <p className="text-sm text-muted-foreground">
              Ajoutez des exercices pour définir la rotation EMOM.
            </p>
          ) : null}

          {!isCountdown && !isComplete && currentExerciseIndices.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant={isCurrentMinuteLogged ? 'soft' : 'pill'}
                disabled={isCurrentMinuteLogged}
                onClick={() => void logEmomMinute()}
              >
                {isCurrentMinuteLogged ? (
                  <>
                    <Check className="size-4" />
                    Minute enregistrée
                  </>
                ) : (
                  <>
                    <CircleCheckBig className="size-4" />
                    Minute faite
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void skipEmomMinute()}
              >
                <SkipForward className="size-4" />
                Passer
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {exercises.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-border p-4">
          <p className="font-display text-sm font-black text-foreground">Rotation</p>
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.exerciseId}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <DisplayExerciseName
                    name={exercise.exerciseName}
                    nameFr={exercise.exerciseNameFr}
                    exerciseId={exercise.exerciseId}
                  />
                  {exercise.emomGroupId != null ? (
                    <p className="text-xs text-muted-foreground">
                      Minute groupée M{exercise.emomGroupId}
                    </p>
                  ) : null}
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Reps"
                  value={exercise.targetReps ?? ''}
                  onChange={(event) => {
                    const raw = event.target.value.trim()
                    void updateExerciseTargetReps(
                      index,
                      raw === '' ? null : Number.parseInt(raw, 10),
                    )
                  }}
                  className="h-9 w-20"
                />
                {exercises.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setGroupAnchorIndex(index)}
                  >
                    Grouper
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void removeExercise(index)}
                >
                  Retirer
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-center">
        <ExercisePicker
          excludeIds={exercises.map((exercise) => exercise.exerciseId)}
          triggerLabel="Ajouter exercice"
          context="active"
          returnTo={{ to: '/app/workout/active' }}
        />
      </div>

      <EmomGroupDrawer
        open={groupAnchorIndex != null}
        onOpenChange={(open) => {
          if (!open) {
            setGroupAnchorIndex(null)
          }
        }}
        exercises={exercises}
        anchorIndex={groupAnchorIndex}
        onConfirm={(anchorIndex, partnerIndices) => {
          void applyEmomGroupMembership(anchorIndex, partnerIndices)
          setGroupAnchorIndex(null)
        }}
      />
    </div>
  )
}
