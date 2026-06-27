import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ListOrdered } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { ActiveWorkoutCircuit } from '@/components/workout/ActiveWorkoutCircuit'
import { ActiveWorkoutFinishFab } from '@/components/workout/ActiveWorkoutFinishFab'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { RestTimerBar } from '@/components/workout/RestTimerBar'
import { HoldTimerBar } from '@/components/workout/HoldTimerBar'
import { StartWorkoutForm } from '@/components/workout/StartWorkoutForm'
import {
  WorkoutRecapDialog,
  type WorkoutRecapData,
} from '@/components/workout/WorkoutRecapDialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { PageHeader, Pill } from '@/design-system'
import { useLastTemplateSetHistory } from '@/hooks/useLastTemplateSetHistory'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useMyProfile } from '@/hooks/useProfile'
import { useRestTimerAudio } from '@/hooks/useRestTimerAudio'
import { useMyWorkouts } from '@/hooks/useWorkouts'
import { useWearWorkoutSync } from '@/hooks/useWearWorkoutSync'
import { Capacitor } from '@capacitor/core'
import { syncWorkoutDraft } from '@/lib/graphql/sync-queue'
import { pushWorkoutSession } from '@/lib/health/push-workout-session'
import { readHeartRateSummary } from '@/lib/health/read-heart-rate-summary'
import { useAuth } from '@/lib/nhost/AuthProvider'
import {
  computeDraftVolume,
  detectWorkoutPersonalRecords,
  draftToWorkoutSummary,
  estimateWorkoutCalories,
} from '@/lib/stats/workout-metrics'
import {
  buildCircuitSteps,
  countCompletedSets,
  getValidatedExercisesForSync,
  isWorkoutComplete,
} from '@/lib/workout/workout-circuit'
import { buildExerciseSetHistoryFromWorkouts } from '@/lib/workout/template-set-history'
import {
  applyOverloadToWorkingSets,
  isWorkingSet,
} from '@/lib/workout/progressive-overload'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export const Route = createFileRoute('/app/workout/active')({
  validateSearch: (search: Record<string, unknown>) => {
    if (typeof search.templateId === 'string' && search.templateId.trim()) {
      return { templateId: search.templateId.trim() }
    }

    return {}
  },
  component: ActiveWorkoutPage,
})

function ActiveWorkoutPage() {
  const { templateId: initialTemplateId } = Route.useSearch()
  const { nhost } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()
  const { data: profile } = useMyProfile()
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: allWorkouts } = useMyWorkouts()
  const rpeEnabled = profile?.rpe_enabled ?? false
  const {
    title,
    startedAt,
    sourceTemplateId,
    exercises: activeExercises,
    activeStepIndex,
    lastCompletedStep,
    restSecondsLeft,
    restTargetSeconds,
    isResting,
    isHolding,
    holdSecondsLeft,
    holdTargetSeconds,
    holdingStep,
    hydrate,
    addExercise,
    removeExercise,
    replaceExercise,
    reorderExercises,
    updateExerciseDefaultRest,
    addToSuperset,
    removeFromSuperset,
    updatePlannedSet,
    addPlannedSet,
    removePlannedSet,
    reorderPlannedSets,
    completeStep,
    uncompleteStep,
    goToStep,
    adjustRest,
    tickRest,
    skipRest,
    startHold,
    stopHold,
    tickHold,
    finishWorkout,
    cancelWorkout,
  } = useActiveWorkoutStore()

  const nextStepLabel = useActiveWorkoutStore((state) => state.getNextStepLabel())

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [recapData, setRecapData] = useState<WorkoutRecapData | null>(null)
  const [isRecapFlow, setIsRecapFlow] = useState(false)
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const wearSyncEnabled = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  const { watchAvailable } = useWearWorkoutSync(wearSyncEnabled && Boolean(startedAt))
  const effectiveTemplateId = sourceTemplateId ?? initialTemplateId
  const { history: templateSetHistory } = useLastTemplateSetHistory(
    effectiveTemplateId,
    { includeRpe: rpeEnabled },
  )
  const setHistory = useMemo(() => {
    if (effectiveTemplateId) {
      return templateSetHistory
    }

    return buildExerciseSetHistoryFromWorkouts(
      activeExercises.map((exercise) => exercise.exerciseId),
      allWorkouts ?? [],
      { includeRpe: rpeEnabled },
    )
  }, [
    activeExercises,
    allWorkouts,
    effectiveTemplateId,
    rpeEnabled,
    templateSetHistory,
  ])
  const showLastSetColumn = activeExercises.length > 0

  const steps = buildCircuitSteps(activeExercises)
  const completedCount = countCompletedSets(activeExercises)
  const allSetsComplete = isWorkoutComplete(
    steps,
    activeExercises,
    lastCompletedStep,
  )

  useRestTimerAudio(isResting, restSecondsLeft)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!isResting) {
      return
    }

    const timer = window.setInterval(() => tickRest(), 1000)
    return () => window.clearInterval(timer)
  }, [isResting, tickRest])

  useEffect(() => {
    if (!isHolding) {
      return
    }

    const timer = window.setInterval(() => tickHold(), 1000)
    return () => window.clearInterval(timer)
  }, [isHolding, tickHold])

  const holdingExercise =
    holdingStep != null ? activeExercises[holdingStep.exerciseIndex] ?? null : null
  const holdExerciseLabel = holdingExercise
    ? `${holdingExercise.exerciseName} — série ${(holdingStep?.setIndex ?? 0) + 1}`
    : null

  async function handleFinish() {
    setFinishConfirmOpen(false)

    if (completedCount === 0) {
      setError('Validez au moins une série avant de terminer.')
      return
    }

    setIsSaving(true)
    setIsRecapFlow(true)
    setError(null)
    setMessage(null)

    try {
      const draft = await finishWorkout()
      if (!draft) {
        setError('Séance introuvable.')
        return
      }

      const validatedExercises = getValidatedExercisesForSync(draft.exercises)
      const endedAt = new Date().toISOString()

      const heartRatePromise = readHeartRateSummary(draft.startedAt, endedAt)

      try {
        await syncWorkoutDraft(nhost, {
          title: draft.title,
          startedAt: draft.startedAt,
          workoutTemplateId: draft.sourceTemplateId,
          exercises: validatedExercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets.map((set) => ({
              setIndex: set.setIndex,
              setType: set.setType ?? 'normal',
              weightKg: set.weightKg,
              reps: set.reps,
              rpe: set.rpe ?? null,
              durationSeconds: set.durationSeconds ?? null,
            })),
          })),
        })
      } catch (syncError) {
        void pushWorkoutSession(draft, endedAt).catch(() => undefined)
        throw syncError
      }

      void pushWorkoutSession(draft, endedAt).catch(() => undefined)

      await queryClient.invalidateQueries({ queryKey: ['workouts'] })

      const heartRate = await heartRatePromise
      const volumeKg = computeDraftVolume(validatedExercises)
      const workoutSummary = draftToWorkoutSummary(
        {
          title: draft.title,
          startedAt: draft.startedAt,
          exercises: validatedExercises,
        },
        endedAt,
      )

      setRecapData({
        title: draft.title,
        startedAt: draft.startedAt,
        endedAt,
        volumeKg,
        completedSets: completedCount,
        estimatedCaloriesKcal: estimateWorkoutCalories({
          startedAt: draft.startedAt,
          endedAt,
          volumeKg,
          completedSets: completedCount,
          bodyWeightKg: nutritionSettings?.weight_kg,
          avgHeartRateBpm: heartRate?.avgBpm,
        }),
        records: detectWorkoutPersonalRecords(workoutSummary, allWorkouts ?? []),
        heartRate,
      })
      setRecapOpen(true)
    } catch (finishError) {
      setIsRecapFlow(false)
      setError(
        finishError instanceof Error
          ? finishError.message
          : 'Impossible de terminer la séance.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!startedAt && !isRecapFlow) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Séance active
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 -ml-2"
              aria-label="Retour"
              onClick={() => router.history.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="font-display text-2xl font-black text-foreground">
              Nouvelle séance
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Composez votre séance, réordonnez les exercices et suivez votre surcharge.
          </p>
        </div>
        <StartWorkoutForm initialTemplateId={initialTemplateId} />
      </div>
    )
  }

  if (!startedAt && isRecapFlow) {
    return (
      <>
        <div className="space-y-4">
          <PageHeader
            eyebrow="Séance terminée"
            title={recapData?.title ?? 'Séance'}
            description={
              isSaving ? 'Enregistrement en cours...' : 'Consultez votre récap ci-dessous.'
            }
          />
        </div>
        <WorkoutRecapDialog
          open={recapOpen}
          onOpenChange={(open) => {
            setRecapOpen(open)
            if (!open) {
              setIsRecapFlow(false)
            }
          }}
          recap={recapData}
          onContinue={() => {
            setIsRecapFlow(false)
            void navigate({ to: '/app/sessions', search: { tab: 'history' } })
          }}
        />
      </>
    )
  }

  return (
    <div
      className={
        isResting || isHolding ? 'space-y-4 pb-44' : 'space-y-4 pb-24'
      }
    >
      {wearSyncEnabled ? (
        <Pill tone={watchAvailable ? 'secondary' : 'default'}>
          {watchAvailable ? 'Montre Wear OS connectée' : 'Montre Wear OS non détectée'}
        </Pill>
      ) : null}

      <PageHeader
        eyebrow="En cours"
        title={title}
        description={`Étape ${Math.min(activeStepIndex + 1, Math.max(steps.length, 1))} / ${Math.max(steps.length, 1)} · ${completedCount} série${completedCount > 1 ? 's' : ''} validée${completedCount > 1 ? 's' : ''}`}
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display font-black">
            <ListOrdered className="size-4" />
            Circuit
          </CardTitle>
          <CardDescription>
            Validez les séries dans l'ordre qui vous convient. Les supersets alternent automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          <ActiveWorkoutCircuit
            exercises={activeExercises}
            lastCompletedStep={lastCompletedStep}
            workoutStartedAt={startedAt}
            rpeEnabled={rpeEnabled}
            templateSetHistory={showLastSetColumn ? setHistory : undefined}
            showLastSetColumn={showLastSetColumn}
            onSelectExercise={(index) => {
              const stepIndex = steps.findIndex((step) => step.exerciseIndex === index)
              if (stepIndex >= 0) {
                goToStep(stepIndex)
              }
            }}
            onReorderExercises={(from, to) => void reorderExercises(from, to)}
            onRemoveExercise={(index) => void removeExercise(index)}
            onReplaceExercise={(exerciseIndex, exercise) =>
              void replaceExercise(exerciseIndex, exercise)
            }
            onAddToSuperset={(from, partner) => void addToSuperset(from, partner)}
            onRemoveFromSuperset={(index) => void removeFromSuperset(index)}
            onUpdateExerciseRest={(index, restSeconds) =>
              void updateExerciseDefaultRest(index, restSeconds)
            }
            onUpdateSet={(exerciseIndex, setIndex, patch) =>
              void updatePlannedSet(exerciseIndex, setIndex, patch)
            }
            onCompleteStep={(exerciseIndex, setIndex) =>
              void completeStep(exerciseIndex, setIndex)
            }
            onStartHold={(exerciseIndex, setIndex) =>
              startHold(exerciseIndex, setIndex)
            }
            onUncompleteStep={(exerciseIndex, setIndex) =>
              void uncompleteStep(exerciseIndex, setIndex)
            }
            onAddPlannedSet={(exerciseIndex) => void addPlannedSet(exerciseIndex)}
            onDeleteSet={(exerciseIndex, setIndex) =>
              void removePlannedSet(exerciseIndex, setIndex)
            }
            onReorderSets={(exerciseIndex, fromIndex, toIndex) =>
              void reorderPlannedSets(exerciseIndex, fromIndex, toIndex)
            }
            onApplyOverloadSuggestion={(exerciseIndex, suggestion) => {
              const exercise = activeExercises[exerciseIndex]
              if (!exercise) {
                return
              }

              const updatedSets = applyOverloadToWorkingSets(exercise.sets, suggestion)
              updatedSets.forEach((set, setIndex) => {
                if (!isWorkingSet(set)) {
                  return
                }

                void updatePlannedSet(exerciseIndex, setIndex, {
                  weightKg: set.weightKg,
                  reps: set.reps,
                  ...(set.durationSeconds != null
                    ? { durationSeconds: set.durationSeconds }
                    : {}),
                  ...(set.distanceKm != null ? { distanceKm: set.distanceKm } : {}),
                })
              })
            }}
          />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <ExercisePicker
          excludeIds={activeExercises.map((exercise) => exercise.exerciseId)}
          onSelect={(exercise) => void addExercise(exercise)}
          triggerLabel="Ajouter exercice"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="pill"
          disabled={isSaving}
          onClick={() => {
            if (completedCount === 0) {
              setError('Validez au moins une série avant de terminer.')
              return
            }

            setError(null)
            setFinishConfirmOpen(true)
          }}
        >
          {isSaving ? 'Enregistrement...' : 'Terminer la séance'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isSaving}
          onClick={() => setCancelConfirmOpen(true)}
        >
          Annuler
        </Button>
      </div>

      <AlertDialog open={finishConfirmOpen} onOpenChange={setFinishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer la séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre séance sera enregistrée avec les séries validées ({completedCount}{' '}
              série{completedCount > 1 ? 's' : ''}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer la séance</AlertDialogCancel>
            <AlertDialogAction disabled={isSaving} onClick={() => void handleFinish()}>
              Terminer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              La séance en cours sera abandonnée et vos progrès ne seront pas enregistrés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer la séance</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setCancelConfirmOpen(false)
                void cancelWorkout()
              }}
            >
              Abandonner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {message ? (
        <p className="text-sm text-secondary-foreground">{message}</p>
      ) : null}
      {error ? <FormMessage>{error}</FormMessage> : null}

      {isHolding ? (
        <HoldTimerBar
          holdSecondsLeft={holdSecondsLeft}
          holdTargetSeconds={holdTargetSeconds}
          exerciseLabel={holdExerciseLabel}
          onStop={() => void stopHold()}
        />
      ) : null}

      {isResting ? (
        <RestTimerBar
          restSecondsLeft={restSecondsLeft}
          restTargetSeconds={restTargetSeconds}
          nextStepLabel={nextStepLabel}
          onAdjust={adjustRest}
          onSkip={skipRest}
        />
      ) : null}

      {allSetsComplete ? (
        <ActiveWorkoutFinishFab
          disabled={isSaving}
          onFinish={() => {
            setError(null)
            setFinishConfirmOpen(true)
          }}
        />
      ) : null}
    </div>
  )
}
