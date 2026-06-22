import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ListOrdered } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ActiveWorkoutCircuit } from '@/components/workout/ActiveWorkoutCircuit'
import { ExercisePerformancePanel } from '@/components/workout/ExercisePerformancePanel'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { RestTimerBar } from '@/components/workout/RestTimerBar'
import { StartWorkoutForm } from '@/components/workout/StartWorkoutForm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { PageHeader, Pill } from '@/design-system'
import { useMyProfile } from '@/hooks/useProfile'
import { useWearWorkoutSync } from '@/hooks/useWearWorkoutSync'
import { Capacitor } from '@capacitor/core'
import { syncWorkoutDraft } from '@/lib/graphql/sync-queue'
import { pushWorkoutSession } from '@/lib/health/push-workout-session'
import { useAuth } from '@/lib/nhost/AuthProvider'
import {
  buildCircuitSteps,
  countCompletedSets,
  getValidatedExercisesForSync,
} from '@/lib/workout/workout-circuit'
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
  const navigate = useNavigate()
  const { data: profile } = useMyProfile()
  const rpeEnabled = profile?.rpe_enabled ?? false
  const {
    title,
    startedAt,
    exercises: activeExercises,
    activeStepIndex,
    lastCompletedStep,
    restSecondsLeft,
    restTargetSeconds,
    isResting,
    hydrate,
    addExercise,
    removeExercise,
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
    finishWorkout,
    cancelWorkout,
    getCurrentStep,
    getNextStepLabel,
  } = useActiveWorkoutStore()

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const wearSyncEnabled = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  const { watchAvailable } = useWearWorkoutSync(wearSyncEnabled && Boolean(startedAt))

  const currentStep = getCurrentStep()
  const currentExercise =
    currentStep != null ? activeExercises[currentStep.exerciseIndex] : null
  const steps = buildCircuitSteps(activeExercises)
  const completedCount = countCompletedSets(activeExercises)

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

  async function handleFinish() {
    if (completedCount === 0) {
      setError('Validez au moins une serie avant de terminer.')
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const draft = await finishWorkout()
      if (!draft) {
        setError('Seance introuvable.')
        return
      }

      const validatedExercises = getValidatedExercisesForSync(draft.exercises)
      const endedAt = new Date().toISOString()

      try {
        await syncWorkoutDraft(nhost, {
          title: draft.title,
          startedAt: draft.startedAt,
          exercises: validatedExercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets.map((set) => ({
              setIndex: set.setIndex,
              setType: set.setType ?? 'normal',
              weightKg: set.weightKg,
              reps: set.reps,
              rpe: set.rpe ?? null,
            })),
          })),
        })
      } catch (syncError) {
        void pushWorkoutSession(draft, endedAt).catch(() => undefined)
        throw syncError
      }

      void pushWorkoutSession(draft, endedAt).catch(() => undefined)

      setMessage('Seance enregistree.')
      await navigate({ to: '/app/sessions', search: { tab: 'history' } })
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : 'Impossible de terminer la seance.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!startedAt) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Seance active"
          title="Nouvelle seance"
          description="Composez votre seance, reordonnez les exercices et suivez votre surcharge."
        />
        <StartWorkoutForm initialTemplateId={initialTemplateId} />
      </div>
    )
  }

  return (
    <div className={isResting ? 'space-y-4 pb-44' : 'space-y-4 pb-24'}>
      {wearSyncEnabled ? (
        <Pill tone={watchAvailable ? 'secondary' : 'default'}>
          {watchAvailable ? 'Montre Wear OS connectee' : 'Montre Wear OS non detectee'}
        </Pill>
      ) : null}

      <PageHeader
        eyebrow="En cours"
        title={title}
        description={`Etape ${Math.min(activeStepIndex + 1, Math.max(steps.length, 1))} / ${Math.max(steps.length, 1)} · ${completedCount} serie${completedCount > 1 ? 's' : ''} validee${completedCount > 1 ? 's' : ''}`}
      />

      {currentExercise ? (
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base font-black">
              Surcharge — {currentExercise.exerciseName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExercisePerformancePanel
              exercise={{
                id: currentExercise.exerciseId,
                name: currentExercise.exerciseName,
                equipment: currentExercise.equipment ?? null,
              }}
              onApplySuggestion={(suggestion) => {
                if (!currentStep) {
                  return
                }

                void updatePlannedSet(currentStep.exerciseIndex, currentStep.setIndex, {
                  weightKg:
                    suggestion.suggestedWeightKg ?? currentExercise.sets[currentStep.setIndex]?.weightKg ?? null,
                  reps:
                    suggestion.suggestedReps ?? currentExercise.sets[currentStep.setIndex]?.reps ?? null,
                })
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display font-black">
            <ListOrdered className="size-4" />
            Circuit
          </CardTitle>
          <CardDescription>
            Validez les series dans l ordre qui vous convient. Les supersets alternent automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          <ActiveWorkoutCircuit
            exercises={activeExercises}
            lastCompletedStep={lastCompletedStep}
            rpeEnabled={rpeEnabled}
            onSelectExercise={(index) => {
              const stepIndex = steps.findIndex((step) => step.exerciseIndex === index)
              if (stepIndex >= 0) {
                goToStep(stepIndex)
              }
            }}
            onReorderExercises={(from, to) => void reorderExercises(from, to)}
            onRemoveExercise={(index) => void removeExercise(index)}
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
          onClick={() => void handleFinish()}
        >
          {isSaving ? 'Enregistrement...' : 'Terminer la seance'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => void cancelWorkout()}>
          Annuler
        </Button>
        <Button variant="outline" size="sm" className="rounded-full" asChild>
          <Link to="/app/exercises">Catalogue</Link>
        </Button>
      </div>

      {message ? (
        <p className="text-sm text-secondary-foreground">{message}</p>
      ) : null}
      {error ? <FormMessage>{error}</FormMessage> : null}

      {isResting ? (
        <RestTimerBar
          restSecondsLeft={restSecondsLeft}
          restTargetSeconds={restTargetSeconds}
          nextStepLabel={getNextStepLabel()}
          onAdjust={adjustRest}
          onSkip={skipRest}
        />
      ) : null}
    </div>
  )
}
