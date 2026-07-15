import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ListOrdered } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'

import { ActiveWorkoutCircuit } from '@/components/workout/ActiveWorkoutCircuit'
import { ActiveWorkoutFinishFab } from '@/components/workout/ActiveWorkoutFinishFab'
import { ActiveWorkoutHoldTimerOverlay } from '@/components/workout/ActiveWorkoutHoldTimerOverlay'
import { ActiveWorkoutRestTimerOverlay } from '@/components/workout/ActiveWorkoutRestTimerOverlay'
import { ActiveWorkoutSummaryTile } from '@/components/workout/ActiveWorkoutSummaryTile'
import { ActiveWorkoutTimerDrivers } from '@/components/workout/ActiveWorkoutTimerDrivers'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { StartWorkoutForm } from '@/components/workout/StartWorkoutForm'
import { useExercisePickerConsumer } from '@/hooks/useExercisePickerConsumer'
import { UpdateTemplateFromWorkoutDialog } from '@/components/workout/UpdateTemplateFromWorkoutDialog'
import {
  WorkoutRecapDialog,
  type WorkoutRecapData,
} from '@/components/workout/WorkoutRecapDialog'
import { WorkoutCelebrationOverlay } from '@/components/workout/WorkoutCelebrationOverlay'
import { BadgeUnlockOverlay } from '@/components/gamification/BadgeUnlockOverlay'
import { OverloadTeaserOverlay } from '@/components/subscription/OverloadTeaserOverlay'
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
import { useExerciseLocale } from '@/hooks/useExerciseLocale'
import { useCurrentWeightKg } from '@/hooks/useWeightGoal'
import { useMyProfile } from '@/hooks/useProfile'
import { useSubscriptionSummary } from '@/hooks/useSubscription'
import { useMyWorkouts, useWorkoutStreakDates } from '@/hooks/useWorkouts'
import { useScheduledSessions } from '@/hooks/useScheduledSessions'
import { useWearWorkoutSync } from '@/hooks/useWearWorkoutSync'
import {
  DEFAULT_GLOBAL_REST_SECONDS,
  templateToDraft,
  useSaveWorkoutTemplate,
  useWorkoutTemplate,
} from '@/hooks/useWorkoutTemplates'
import { Capacitor } from '@capacitor/core'
import { syncWorkoutDraft } from '@/lib/graphql/sync-queue'
import { useSyncMyBadges } from '@/hooks/useBadges'
import type { BadgeDefinition } from '@/lib/gamification/badges'
import { pushWorkoutSession } from '@/lib/health/push-workout-session'
import { readHeartRateSummary } from '@/lib/health/read-heart-rate-summary'
import { useAuth } from '@/lib/nhost/AuthProvider'
import {
  computeDraftVolume,
  detectWorkoutPersonalRecords,
  draftToWorkoutSummary,
  estimateWorkoutCalories,
} from '@/lib/stats/workout-metrics'
import { computeWorkoutBodyIntensities } from '@/lib/stats/exercise-body-intensities'
import {
  buildCircuitSteps,
  countCompletedSets,
  findNextStepIndexAfter,
  getStepExerciseDisplayName,
  getValidatedExercisesForSync,
  isWorkoutComplete,
} from '@/lib/workout/workout-circuit'
import {
  applyOverloadToWorkingSets,
  isWorkingSet,
} from '@/lib/workout/progressive-overload'
import {
  getFreeOverloadAdviceState,
  markFreeOverloadAdviceUsed,
  resolveDailyOverloadExerciseId,
} from '@/lib/subscription/overload-advice-quota'
import { buildExerciseSetHistoryFromWorkouts } from '@/lib/workout/template-set-history'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import {
  buildWorkoutCelebrations,
  type WorkoutCelebrationItem,
} from '@/lib/workout/workout-celebration'
import { activeExercisesToTemplateDrafts } from '@/lib/workout/active-to-template'
import {
  snapshotExerciseLineup,
  snapshotFromTemplateDrafts,
  templateLineupChanged,
  type TemplateExerciseLineSnapshot,
} from '@/lib/workout/template-lineup'

export const Route = createFileRoute('/app/workout/active')({
  validateSearch: (search: Record<string, unknown>) => {
    const result: {
      templateId?: string
      previewWorkoutCelebration?: 'planned' | 'weekly_streak'
      previewWeeklyStreak?: number
    } = {}

    if (typeof search.templateId === 'string' && search.templateId.trim()) {
      result.templateId = search.templateId.trim()
    }

    if (search.previewWorkoutCelebration === 'planned') {
      result.previewWorkoutCelebration = 'planned'
    } else if (search.previewWorkoutCelebration === 'weekly_streak') {
      result.previewWorkoutCelebration = 'weekly_streak'
    }

    if (typeof search.previewWeeklyStreak === 'string') {
      const streak = Number.parseInt(search.previewWeeklyStreak, 10)
      if (Number.isFinite(streak) && streak >= 1) {
        result.previewWeeklyStreak = streak
      }
    } else if (typeof search.previewWeeklyStreak === 'number' && search.previewWeeklyStreak >= 1) {
      result.previewWeeklyStreak = search.previewWeeklyStreak
    }

    return result
  },
  component: ActiveWorkoutPage,
})

function ActiveWorkoutPage() {
  const { templateId: initialTemplateId, previewWorkoutCelebration, previewWeeklyStreak } =
    Route.useSearch()
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const router = useRouter()
  const { data: profile } = useMyProfile()
  const { isPremium } = useSubscriptionSummary()
  const bodyWeightKg = useCurrentWeightKg()
  const { data: allWorkouts } = useMyWorkouts()
  const { data: streakWorkouts = [] } = useWorkoutStreakDates()
  const { data: scheduledResult } = useScheduledSessions()
  const scheduledSessions = scheduledResult?.sessions ?? []
  const rpeEnabled = profile?.rpe_enabled ?? false
  const {
    title,
    startedAt,
    sourceTemplateId,
    sourceTemplateExerciseLineup,
    exercises: activeExercises,
    lastCompletedStep,
    hydrate,
    addExercise,
    removeExercise,
    replaceExercise,
    reorderExercises,
    updateExerciseDefaultRest,
    applySupersetMembership,
    removeFromSuperset,
    updatePlannedSet,
    addPlannedSet,
    removePlannedSet,
    reorderPlannedSets,
    completeStep,
    uncompleteStep,
    goToStep,
    finishWorkout,
    cancelWorkout,
  } = useActiveWorkoutStore(
    useShallow((state) => ({
      title: state.title,
      startedAt: state.startedAt,
      sourceTemplateId: state.sourceTemplateId,
      sourceTemplateExerciseLineup: state.sourceTemplateExerciseLineup,
      exercises: state.exercises,
      lastCompletedStep: state.lastCompletedStep,
      hydrate: state.hydrate,
      addExercise: state.addExercise,
      removeExercise: state.removeExercise,
      replaceExercise: state.replaceExercise,
      reorderExercises: state.reorderExercises,
      updateExerciseDefaultRest: state.updateExerciseDefaultRest,
      applySupersetMembership: state.applySupersetMembership,
      removeFromSuperset: state.removeFromSuperset,
      updatePlannedSet: state.updatePlannedSet,
      addPlannedSet: state.addPlannedSet,
      removePlannedSet: state.removePlannedSet,
      reorderPlannedSets: state.reorderPlannedSets,
      completeStep: state.completeStep,
      uncompleteStep: state.uncompleteStep,
      goToStep: state.goToStep,
      finishWorkout: state.finishWorkout,
      cancelWorkout: state.cancelWorkout,
    })),
  )

  useExercisePickerConsumer({
    onAdd: (exercise) => addExercise(exercise),
    onReplace: (index, exercise) => replaceExercise(index, exercise),
  })

  const startHold = useActiveWorkoutStore((state) => state.startHold)
  const isResting = useActiveWorkoutStore((state) => state.isResting)
  const isHolding = useActiveWorkoutStore((state) => state.isHolding)

  const exerciseLocale = useExerciseLocale()

  const currentExerciseLabel = useMemo(() => {
    const steps = buildCircuitSteps(activeExercises)
    const nextIndex = findNextStepIndexAfter(
      steps,
      activeExercises,
      lastCompletedStep,
    )
    const currentStep = nextIndex != null ? steps[nextIndex] ?? null : null

    return getStepExerciseDisplayName(activeExercises, currentStep, exerciseLocale)
  }, [activeExercises, lastCompletedStep, exerciseLocale])

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [recapData, setRecapData] = useState<WorkoutRecapData | null>(null)
  const [celebrationQueue, setCelebrationQueue] = useState<WorkoutCelebrationItem[]>([])
  const [finishedWorkoutId, setFinishedWorkoutId] = useState<string | null>(null)
  const [isRecapFlow, setIsRecapFlow] = useState(false)
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [templateUpdateOpen, setTemplateUpdateOpen] = useState(false)
  const [templateComparison, setTemplateComparison] = useState<{
    before: TemplateExerciseLineSnapshot[]
    after: TemplateExerciseLineSnapshot[]
  } | null>(null)
  const [overloadTeaserOpen, setOverloadTeaserOpen] = useState(false)
  const [overloadQuotaVersion, setOverloadQuotaVersion] = useState(0)
  const [overloadHintsHandled, setOverloadHintsHandled] = useState<Set<string>>(
    () => new Set(),
  )
  const [pendingBadgeUnlocks, setPendingBadgeUnlocks] = useState<BadgeDefinition[]>([])
  const [badgeOverlayOpen, setBadgeOverlayOpen] = useState(false)
  const syncBadges = useSyncMyBadges()

  const exerciseIds = useMemo(
    () => activeExercises.map((exercise) => exercise.exerciseId),
    [activeExercises],
  )
  const dailyOverloadExerciseId = useMemo(() => {
    if (!user?.id || exerciseIds.length === 0) {
      return null
    }
    return resolveDailyOverloadExerciseId(user.id, exerciseIds)
  }, [exerciseIds, user?.id])
  const freeOverloadAdviceState = useMemo(() => {
    if (!user?.id) {
      return null
    }
    return getFreeOverloadAdviceState(user.id)
  }, [user?.id, overloadQuotaVersion])

  const wearSyncEnabled = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  const { watchAvailable, watchStatusLabel } = useWearWorkoutSync(wearSyncEnabled && Boolean(startedAt))
  const effectiveTemplateId = sourceTemplateId ?? initialTemplateId
  const { data: sourceTemplate } = useWorkoutTemplate(effectiveTemplateId ?? '')
  const saveWorkoutTemplate = useSaveWorkoutTemplate()
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
  const currentCelebration = celebrationQueue[0] ?? null

  useEffect(() => {
    if (!import.meta.env.DEV || !previewWorkoutCelebration) {
      return
    }

    setIsRecapFlow(true)
    setCelebrationQueue([
      previewWorkoutCelebration === 'planned'
        ? { kind: 'planned' }
        : { kind: 'weekly_streak', streak: previewWeeklyStreak ?? 3 },
    ])
  }, [previewWeeklyStreak, previewWorkoutCelebration])

  function dismissCelebration() {
    const nextQueue = celebrationQueue.slice(1)
    setCelebrationQueue(nextQueue)

    if (nextQueue.length > 0) {
      return
    }

    if (pendingBadgeUnlocks.length > 0) {
      setBadgeOverlayOpen(true)
      return
    }

    setRecapOpen(true)
  }

  function dismissBadgeOverlay() {
    setBadgeOverlayOpen(false)
    setRecapOpen(true)
  }
  const allSetsComplete = isWorkoutComplete(
    steps,
    activeExercises,
    lastCompletedStep,
  )

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  async function saveFinishedWorkout(updateTemplate: boolean) {
    setTemplateUpdateOpen(false)
    setTemplateComparison(null)
    setIsSaving(true)
    setIsRecapFlow(true)
    setError(null)
    setMessage(null)

    const storeSnapshot = useActiveWorkoutStore.getState()
    const exercisesSnapshot = storeSnapshot.exercises
    const defaultRestSnapshot = storeSnapshot.defaultRestSeconds
    const templateIdSnapshot = storeSnapshot.sourceTemplateId

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
        const workoutId = await syncWorkoutDraft(nhost, {
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
        setFinishedWorkoutId(workoutId)
      } catch (syncError) {
        void pushWorkoutSession(draft, endedAt).catch(() => undefined)
        throw syncError
      }

      void pushWorkoutSession(draft, endedAt).catch(() => undefined)

      if (updateTemplate && templateIdSnapshot) {
        if (!sourceTemplate) {
          throw new Error('Impossible de mettre à jour le modèle pour le moment.')
        }

        await saveWorkoutTemplate.mutateAsync({
          templateId: templateIdSnapshot,
          name: sourceTemplate.name,
          folderName: sourceTemplate.folder_name ?? null,
          defaultRestSeconds:
            sourceTemplate.default_rest_seconds ?? DEFAULT_GLOBAL_REST_SECONDS,
          exercises: activeExercisesToTemplateDrafts(
            exercisesSnapshot,
            defaultRestSnapshot,
          ),
        })
      }

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
          bodyWeightKg: bodyWeightKg ?? undefined,
          avgHeartRateBpm: heartRate?.avgBpm,
        }),
        records: detectWorkoutPersonalRecords(workoutSummary, allWorkouts ?? []),
        heartRate,
        bodyIntensities: computeWorkoutBodyIntensities(validatedExercises),
      })

      const celebrations = buildWorkoutCelebrations({
        sessions: scheduledSessions,
        existingWorkouts: streakWorkouts,
        workoutTemplateId: draft.sourceTemplateId,
        startedAt: draft.startedAt,
      })

      const badgeResult = await syncBadges.mutateAsync().catch(() => ({
        keys: [] as string[],
        definitions: [] as BadgeDefinition[],
      }))
      const unlockedBadges = badgeResult.definitions
      setPendingBadgeUnlocks(unlockedBadges)

      if (celebrations.length > 0) {
        setCelebrationQueue(celebrations)
      } else if (unlockedBadges.length > 0) {
        setBadgeOverlayOpen(true)
      } else {
        setRecapOpen(true)
      }
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

  async function handleFinish() {
    setFinishConfirmOpen(false)

    if (completedCount === 0) {
      setError('Validez au moins une série avant de terminer.')
      return
    }

    const templateId = sourceTemplateId
    if (!templateId) {
      await saveFinishedWorkout(false)
      return
    }

    const before =
      sourceTemplateExerciseLineup && sourceTemplateExerciseLineup.length > 0
        ? sourceTemplateExerciseLineup
        : sourceTemplate
          ? snapshotFromTemplateDrafts(templateToDraft(sourceTemplate).exercises)
          : null

    if (!before) {
      await saveFinishedWorkout(false)
      return
    }

    const after = snapshotExerciseLineup(activeExercises)
    if (!templateLineupChanged(before, after)) {
      await saveFinishedWorkout(false)
      return
    }

    setTemplateComparison({ before, after })
    setTemplateUpdateOpen(true)
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
              setCelebrationQueue([])
            }
          }}
          recap={recapData}
          onContinue={() => {
            setIsRecapFlow(false)
            setCelebrationQueue([])
            setPendingBadgeUnlocks([])
            if (finishedWorkoutId) {
              void navigate({
                to: '/app/workouts/$workoutId',
                params: { workoutId: finishedWorkoutId },
              })
              return
            }
            void navigate({ to: '/app/sessions', search: { tab: 'history' } })
          }}
        />
        <WorkoutCelebrationOverlay
          open={currentCelebration !== null}
          variant={currentCelebration?.kind ?? 'planned'}
          weeklyStreak={
            currentCelebration?.kind === 'weekly_streak' ? currentCelebration.streak : undefined
          }
          onClose={dismissCelebration}
        />
        <BadgeUnlockOverlay
          badges={pendingBadgeUnlocks}
          open={badgeOverlayOpen}
          onClose={dismissBadgeOverlay}
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
          {watchStatusLabel}
        </Pill>
      ) : null}

      <div className="flex items-center gap-2.5">
        <h1 className="min-w-0 truncate font-display text-2xl font-black text-foreground">
          {title}
        </h1>
        <Pill tone="secondary" className="shrink-0 font-semibold">
          En cours
        </Pill>
      </div>

      {startedAt ? (
        <ActiveWorkoutSummaryTile
          startedAt={startedAt}
          exercises={activeExercises}
          currentExerciseLabel={currentExerciseLabel}
          bodyWeightKg={bodyWeightKg}
        />
      ) : null}

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
          {activeExercises.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Ajoutez votre premier exercice pour commencer le circuit.
              </p>
              <div className="mt-4">
                <ExercisePicker
                  excludeIds={[]}
                  triggerLabel="Ajouter exercice"
                  context="active"
                  returnTo={{ to: '/app/workout/active' }}
                />
              </div>
            </div>
          ) : (
            <ActiveWorkoutCircuit
              exercises={activeExercises}
              lastCompletedStep={lastCompletedStep}
              workoutStartedAt={startedAt}
              rpeEnabled={rpeEnabled}
              bodyWeightKg={bodyWeightKg ?? undefined}
              templateSetHistory={showLastSetColumn ? setHistory : undefined}
              showLastSetColumn={showLastSetColumn}
              overloadGate={{
                isPremium,
                dailyExerciseId: dailyOverloadExerciseId,
                isFreeQuotaAvailable: !freeOverloadAdviceState?.used,
              }}
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
              onApplySupersetMembership={(anchor, partners) =>
                void applySupersetMembership(anchor, partners)
              }
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
                if (!exercise || !suggestion.actionable) {
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

                setOverloadHintsHandled((previous) => {
                  const next = new Set(previous)
                  next.add(exercise.exerciseId)
                  return next
                })

                if (
                  !isPremium &&
                  user?.id &&
                  exercise.exerciseId === dailyOverloadExerciseId &&
                  !freeOverloadAdviceState?.used
                ) {
                  markFreeOverloadAdviceUsed(user.id, exercise.exerciseId)
                  setOverloadQuotaVersion((version) => version + 1)
                  setOverloadTeaserOpen(true)
                }
              }}
              overloadHintsHandled={overloadHintsHandled}
              onDismissOverloadHint={(exerciseId) => {
                setOverloadHintsHandled((previous) => {
                  const next = new Set(previous)
                  next.add(exerciseId)
                  return next
                })
              }}
            />
          )}
        </CardContent>
      </Card>

      {activeExercises.length > 0 ? (
        <div className="flex justify-center">
          <ExercisePicker
            excludeIds={activeExercises.map((exercise) => exercise.exerciseId)}
            triggerLabel="Ajouter exercice"
            context="active"
            returnTo={{ to: '/app/workout/active' }}
          />
        </div>
      ) : null}

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
                void (async () => {
                  await cancelWorkout()
                  void navigate({ to: '/app/sessions', search: { tab: 'catalog' } })
                })()
              }}
            >
              Abandonner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {templateComparison ? (
        <UpdateTemplateFromWorkoutDialog
          open={templateUpdateOpen}
          onOpenChange={(open) => {
            setTemplateUpdateOpen(open)
            if (!open && !isSaving) {
              setTemplateComparison(null)
            }
          }}
          templateName={sourceTemplate?.name ?? title}
          before={templateComparison.before}
          after={templateComparison.after}
          isSaving={isSaving}
          onKeepTemplate={() => void saveFinishedWorkout(false)}
          onUpdateTemplate={() => void saveFinishedWorkout(true)}
        />
      ) : null}

      {message ? (
        <p className="text-sm text-secondary-foreground">{message}</p>
      ) : null}
      {error ? <FormMessage>{error}</FormMessage> : null}

      <ActiveWorkoutTimerDrivers />
      <ActiveWorkoutHoldTimerOverlay />
      <ActiveWorkoutRestTimerOverlay />

      {allSetsComplete ? (
        <ActiveWorkoutFinishFab
          disabled={isSaving}
          onFinish={() => {
            setError(null)
            setFinishConfirmOpen(true)
          }}
        />
      ) : null}

      <OverloadTeaserOverlay
        open={overloadTeaserOpen}
        onClose={() => setOverloadTeaserOpen(false)}
      />
    </div>
  )
}
