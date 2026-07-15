import { useEffect, useState } from 'react'
import { Play, Save } from 'lucide-react'

import { ExerciseDetailDrawer } from '@/components/workout/ExerciseDetailDrawer'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { ExerciseReorderDrawer } from '@/components/workout/ExerciseReorderDrawer'
import { SortableExerciseList } from '@/components/workout/SortableExerciseList'
import { Pill } from '@/design-system'
import { useExercisePickerConsumer } from '@/hooks/useExercisePickerConsumer'
import {
  ExerciseStatsDrawer,
  type ExerciseStatsDrawerTarget,
} from '@/components/stats/ExerciseStatsDrawer'
import { TemplateEditorMenu } from '@/components/workout/TemplateEditorMenu'
import { TemplateExerciseSetsEditor } from '@/components/workout/TemplateExerciseSetsEditor'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  applyEmomGroupMembership,
  cleanupEmomGroupAfterRemoval,
  compactEmomGroupBlocks,
  removeExerciseFromEmomGroup,
} from '@/lib/workout/exercise-emom-group'
import {
  applySupersetMembership,
  cleanupSupersetAfterRemoval,
  compactSupersetBlocks,
  removeExerciseFromSuperset,
} from '@/lib/workout/exercise-superset'
import {
  createTemplateSet,
  exerciseToDraft,
  exerciseToEmomDraft,
  inheritSetValues,
  type TemplateExerciseDraft,
} from '@/hooks/useWorkoutTemplates'
import { useMyProfile } from '@/hooks/useProfile'
import type { Exercise } from '@/lib/graphql/operations'
import type { ActiveExerciseEntry } from '@/lib/workout/active-store'
import { replaceTemplateExercise } from '@/lib/workout/replace-exercise'
import { templateExercisesToActive } from '@/lib/workout/template-mapper'
import {
  DEFAULT_EMOM_INTERVAL_SECONDS,
  DEFAULT_SESSION_MODE,
  type SessionMode,
} from '@/lib/workout/session-mode'

export type TemplateEditorSessionConfig = {
  sessionMode: SessionMode
  emomIntervalSeconds: number
  emomTotalMinutes: number
}

type TemplateEditorFormProps = {
  templateId?: string
  shareToken?: string | null
  initialName?: string
  initialFolderName?: string | null
  initialExercises?: TemplateExerciseDraft[]
  initialSessionMode?: SessionMode
  initialEmomIntervalSeconds?: number
  initialEmomTotalMinutes?: number
  isSaving?: boolean
  onSave: (
    name: string,
    exercises: TemplateExerciseDraft[],
    folderName: string | null,
    config: TemplateEditorSessionConfig,
  ) => Promise<void>
  onStart?: (
    name: string,
    exercises: TemplateExerciseDraft[],
    folderName: string | null,
    config: TemplateEditorSessionConfig,
  ) => Promise<void>
}

export function TemplateEditorForm({
  templateId,
  shareToken = null,
  initialName = '',
  initialFolderName = null,
  initialExercises = [],
  initialSessionMode = DEFAULT_SESSION_MODE,
  initialEmomIntervalSeconds = DEFAULT_EMOM_INTERVAL_SECONDS,
  initialEmomTotalMinutes = 12,
  isSaving = false,
  onSave,
  onStart,
}: TemplateEditorFormProps) {
  const { data: profile } = useMyProfile()
  const rpeEnabled = profile?.rpe_enabled ?? false
  const [name, setName] = useState(initialName)
  const [folderName, setFolderName] = useState(initialFolderName ?? '')
  const [sessionMode] = useState<SessionMode>(initialSessionMode)
  const [emomIntervalSeconds, setEmomIntervalSeconds] = useState(
    String(initialEmomIntervalSeconds),
  )
  const [emomTotalMinutes, setEmomTotalMinutes] = useState(String(initialEmomTotalMinutes))
  const [exercises, setExercises] = useState<TemplateExerciseDraft[]>(initialExercises)
  const [activeIndex, setActiveIndex] = useState(0)
  const [reorderOpen, setReorderOpen] = useState(false)
  const [detailExercise, setDetailExercise] = useState<ActiveExerciseEntry | null>(null)
  const [statsExercise, setStatsExercise] = useState<ExerciseStatsDrawerTarget | null>(
    null,
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isEmom = sessionMode === 'emom'

  useEffect(() => {
    setName(initialName)
    setFolderName(initialFolderName ?? '')
    setExercises(initialExercises)
    setEmomIntervalSeconds(String(initialEmomIntervalSeconds))
    setEmomTotalMinutes(String(initialEmomTotalMinutes))
  }, [
    initialName,
    initialFolderName,
    initialExercises,
    initialSessionMode,
    initialEmomIntervalSeconds,
    initialEmomTotalMinutes,
  ])

  const activeEntries: ActiveExerciseEntry[] = templateExercisesToActive(
    exercises,
    sessionMode,
  )

  function buildSessionConfig(): TemplateEditorSessionConfig {
    const intervalSeconds = Number.parseInt(emomIntervalSeconds, 10)
    const totalMinutes = Number.parseInt(emomTotalMinutes, 10)

    if (sessionMode === 'emom') {
      if (!Number.isFinite(totalMinutes) || totalMinutes < 1) {
        throw new Error('Indiquez une durée EMOM valide (au moins 1 minute).')
      }

      if (!Number.isFinite(intervalSeconds) || intervalSeconds < 1) {
        throw new Error('Indiquez un intervalle EMOM valide (au moins 1 seconde).')
      }
    }

    return {
      sessionMode,
      emomIntervalSeconds: intervalSeconds || DEFAULT_EMOM_INTERVAL_SECONDS,
      emomTotalMinutes: totalMinutes || 12,
    }
  }

  function handleAddExercise(exercise: Exercise) {
    if (exercises.some((item) => item.exerciseId === exercise.id)) {
      return
    }

    const next = [
      ...exercises,
      isEmom ? exerciseToEmomDraft(exercise) : exerciseToDraft(exercise),
    ]
    setExercises(next)
    setActiveIndex(next.length - 1)
  }

  function handleReorder(from: number, to: number) {
    const next = [...exercises]
    const [moved] = next.splice(from, 1)
    if (!moved) {
      return
    }
    next.splice(to, 0, moved)
    const compacted = isEmom ? compactEmomGroupBlocks(next) : compactSupersetBlocks(next)
    setExercises(compacted)

    if (activeIndex === from) {
      setActiveIndex(to)
    } else if (from < activeIndex && to >= activeIndex) {
      setActiveIndex(activeIndex - 1)
    } else if (from > activeIndex && to <= activeIndex) {
      setActiveIndex(activeIndex + 1)
    }
  }

  function handleRemove(index: number) {
    const next = isEmom
      ? cleanupEmomGroupAfterRemoval(
          exercises.filter((_, itemIndex) => itemIndex !== index),
        )
      : cleanupSupersetAfterRemoval(
          exercises.filter((_, itemIndex) => itemIndex !== index),
        )
    setExercises(next)
    setActiveIndex(Math.min(activeIndex, Math.max(next.length - 1, 0)))
  }

  function handleReplace(index: number, exercise: Exercise) {
    if (exercises.some((item, itemIndex) => itemIndex !== index && item.exerciseId === exercise.id)) {
      return
    }

    setExercises((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? replaceTemplateExercise(item, exercise) : item,
      ),
    )
  }

  useExercisePickerConsumer({
    onAdd: handleAddExercise,
    onReplace: handleReplace,
  })

  function handleAddSet(exerciseIndex: number) {
    setExercises((current) =>
      current.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise
        }

        const inherited = inheritSetValues(exercise.sets)
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            createTemplateSet(
              exercise.sets.length,
              exercise.defaultRestSeconds,
              inherited,
            ),
          ],
        }
      }),
    )
  }

  function handleApplySupersetMembership(anchorIndex: number, partnerIndices: number[]) {
    setExercises((current) => applySupersetMembership(current, anchorIndex, partnerIndices))
  }

  function handleRemoveFromSuperset(index: number) {
    setExercises((current) => removeExerciseFromSuperset(current, index))
  }

  function handleApplyEmomGroupMembership(anchorIndex: number, partnerIndices: number[]) {
    setExercises((current) => applyEmomGroupMembership(current, anchorIndex, partnerIndices))
  }

  function handleRemoveFromEmomGroup(index: number) {
    setExercises((current) => removeExerciseFromEmomGroup(current, index))
  }

  function handleUpdateExercise(index: number, exercise: TemplateExerciseDraft) {
    setExercises((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? exercise : item)),
    )
  }

  function handleUpdateTargetReps(index: number, rawValue: string) {
    const targetReps = rawValue.trim() === '' ? null : Number.parseInt(rawValue, 10)
    setExercises((current) =>
      current.map((exercise, itemIndex) =>
        itemIndex === index
          ? { ...exercise, targetReps: Number.isFinite(targetReps) ? targetReps : null }
          : exercise,
      ),
    )
  }

  function handleUpdateTargetWeight(index: number, rawValue: string) {
    const targetWeightKg =
      rawValue.trim() === '' ? null : Number.parseFloat(rawValue.replace(',', '.'))
    setExercises((current) =>
      current.map((exercise, itemIndex) =>
        itemIndex === index
          ? {
              ...exercise,
              targetWeightKg:
                targetWeightKg != null && Number.isFinite(targetWeightKg) && targetWeightKg >= 0
                  ? targetWeightKg
                  : null,
            }
          : exercise,
      ),
    )
  }

  async function handleSave() {
    setError(null)
    setMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Indiquez un nom pour la séance.')
      return
    }

    try {
      await onSave(trimmedName, exercises, folderName.trim() || null, buildSessionConfig())
      setMessage('Séance sauvegardée.')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible de sauvegarder la séance.',
      )
    }
  }

  async function handleStart() {
    if (!onStart) {
      return
    }

    setError(null)
    setMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Indiquez un nom pour la séance.')
      return
    }
    if (exercises.length === 0) {
      setError('Ajoutez au moins un exercice.')
      return
    }

    try {
      await onStart(trimmedName, exercises, folderName.trim() || null, buildSessionConfig())
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : 'Impossible de démarrer la séance.',
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 space-y-3 rounded-2xl border border-border bg-background/95 p-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom de la séance"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent px-1 font-display text-lg font-black shadow-none focus-visible:ring-0"
          />
          {templateId ? (
            <TemplateEditorMenu
              templateId={templateId}
              title={name}
              shareToken={shareToken}
            />
          ) : null}
        </div>
        <Input
          value={folderName}
          onChange={(event) => setFolderName(event.target.value)}
          placeholder="Dossier (optionnel)"
          className="h-9 border-border/70 bg-muted/20 text-sm"
        />
        <div className="space-y-2">
          <Label>Type de séance</Label>
          <Pill tone={isEmom ? 'purple' : 'secondary'}>
            {isEmom ? 'EMOM' : 'Circuit'}
          </Pill>
        </div>
        {isEmom ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="templateEmomTotalMinutes">Durée totale (minutes)</Label>
              <Input
                id="templateEmomTotalMinutes"
                type="number"
                min={1}
                inputMode="numeric"
                value={emomTotalMinutes}
                onChange={(event) => setEmomTotalMinutes(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateEmomIntervalSeconds">Intervalle (secondes)</Label>
              <Input
                id="templateEmomIntervalSeconds"
                type="number"
                min={1}
                inputMode="numeric"
                value={emomIntervalSeconds}
                onChange={(event) => setEmomIntervalSeconds(event.target.value)}
              />
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="pill"
            size="sm"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            <Save className="size-4" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          {onStart ? (
            <Button
              variant="soft"
              size="sm"
              onClick={() => void handleStart()}
              disabled={isSaving}
            >
              <Play className="size-4" />
              Démarrer
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">Exercices</CardTitle>
              <CardDescription>
                {exercises.length} exercice(s)
                {isEmom ? ' · rotation par minute' : ''}
              </CardDescription>
            </div>
            <ExercisePicker
              excludeIds={exercises.map((exercise) => exercise.exerciseId)}
              context="template"
              templateId={templateId}
              returnTo={{
                to: '/app/sessions/$templateId',
                params: templateId ? { templateId } : undefined,
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-0 pb-0">
          <SortableExerciseList
            exercises={activeEntries}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onReorder={handleReorder}
            onRemove={handleRemove}
            onReplace={handleReplace}
            onApplySupersetMembership={isEmom ? undefined : handleApplySupersetMembership}
            onRemoveFromSuperset={isEmom ? undefined : handleRemoveFromSuperset}
            onApplyEmomGroupMembership={isEmom ? handleApplyEmomGroupMembership : undefined}
            onRemoveFromEmomGroup={isEmom ? handleRemoveFromEmomGroup : undefined}
            showSetCount={!isEmom}
            dragHandle="subtle"
            showDeleteButton={false}
            embedded
            onOpenReorder={() => setReorderOpen(true)}
            onAddSet={isEmom ? undefined : handleAddSet}
            pickerContext="template"
            pickerReturnTo={{
              to: '/app/sessions/$templateId',
              params: templateId ? { templateId } : undefined,
            }}
            pickerTemplateId={templateId}
            onViewDetails={(index) => {
              const exercise = activeEntries[index]
              if (exercise) {
                setDetailExercise(exercise)
              }
            }}
            onViewStats={(index) => {
              const exercise = activeEntries[index]
              if (!exercise) {
                return
              }

              setStatsExercise({
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                exerciseNameFr: exercise.exerciseNameFr,
                muscleGroup: exercise.muscleGroup,
                equipment: exercise.equipment,
              })
            }}
            renderBelowTitle={
              isEmom
                ? (index) => (
                    <div className="mt-2 flex flex-wrap items-center gap-3 px-4">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`target-reps-${index}`}
                          className="text-xs text-muted-foreground"
                        >
                          Reps
                        </Label>
                        <Input
                          id={`target-reps-${index}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          placeholder="—"
                          value={exercises[index]?.targetReps ?? ''}
                          onChange={(event) =>
                            handleUpdateTargetReps(index, event.target.value)
                          }
                          className="h-8 w-20"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`target-weight-${index}`}
                          className="text-xs text-muted-foreground"
                        >
                          Charge (kg)
                        </Label>
                        <Input
                          id={`target-weight-${index}`}
                          type="number"
                          min={0}
                          step={0.5}
                          inputMode="decimal"
                          placeholder="—"
                          value={exercises[index]?.targetWeightKg ?? ''}
                          onChange={(event) =>
                            handleUpdateTargetWeight(index, event.target.value)
                          }
                          className="h-8 w-24"
                        />
                      </div>
                    </div>
                  )
                : undefined
            }
            renderSetsContent={
              isEmom
                ? undefined
                : (index) => (
                    <TemplateExerciseSetsEditor
                      exercise={exercises[index]!}
                      templateId={templateId}
                      includeRpeInHistory={rpeEnabled}
                      onChange={(exercise) => handleUpdateExercise(index, exercise)}
                    />
                  )
            }
          />

          <div className="px-4 pb-4">
            <ExerciseReorderDrawer
              open={reorderOpen}
              onOpenChange={setReorderOpen}
              exercises={activeEntries}
              onReorder={handleReorder}
            />
          </div>
        </CardContent>
      </Card>

      <ExerciseDetailDrawer
        open={detailExercise != null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailExercise(null)
          }
        }}
        exercise={detailExercise}
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

      {message ? <FeedbackMessage variant="success">{message}</FeedbackMessage> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
