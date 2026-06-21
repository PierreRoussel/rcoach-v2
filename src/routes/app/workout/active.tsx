import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

import { ExercisePerformancePanel } from '@/components/workout/ExercisePerformancePanel'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { SortableExerciseList } from '@/components/workout/SortableExerciseList'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, Pill } from '@/design-system'
import { syncWorkoutDraft } from '@/lib/graphql/sync-queue'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import type { OverloadSuggestion } from '@/lib/workout/progressive-overload'

export const Route = createFileRoute('/app/workout/active')({
  component: ActiveWorkoutPage,
})

function ActiveWorkoutPage() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const {
    title,
    startedAt,
    exercises: activeExercises,
    activeExerciseIndex,
    restSecondsLeft,
    isResting,
    hydrate,
    startWorkout,
    addExercise,
    removeExercise,
    reorderExercises,
    setActiveExerciseIndex,
    addSet,
    startRest,
    tickRest,
    finishWorkout,
    cancelWorkout,
  } = useActiveWorkoutStore()

  const [workoutTitle, setWorkoutTitle] = useState('Seance libre')
  const [weightKg, setWeightKg] = useState('')
  const [reps, setReps] = useState('')
  const [setType, setSetType] = useState<'normal' | 'warmup' | 'failure'>('normal')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const activeExercise = activeExercises[activeExerciseIndex]

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

  function applySuggestion(suggestion: OverloadSuggestion) {
    if (suggestion.suggestedWeightKg != null) {
      setWeightKg(String(suggestion.suggestedWeightKg))
    }
    if (suggestion.suggestedReps != null) {
      setReps(String(suggestion.suggestedReps))
    }
  }

  async function handleStart() {
    setError(null)
    await startWorkout(workoutTitle.trim() || 'Seance libre')
  }

  async function handleLogSet() {
    if (!activeExercise) {
      setError('Ajoutez un exercice avant de logger un set.')
      return
    }

    setError(null)
    await addSet(activeExerciseIndex, {
      setType,
      weightKg: weightKg ? Number(weightKg) : null,
      reps: reps ? Number(reps) : null,
    })
    setWeightKg('')
    setReps('')
    setSetType('normal')
    startRest(90)
  }

  async function handleFinish() {
    const hasLoggedSets = activeExercises.some(
      (exercise) => exercise.sets.length > 0,
    )

    if (!hasLoggedSets) {
      setError('Ajoutez au moins un set avant de terminer.')
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

      await syncWorkoutDraft(nhost, {
        title: draft.title,
        startedAt: draft.startedAt,
        exercises: draft.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets.map((set) => ({
            setIndex: set.setIndex,
            setType: set.setType,
            weightKg: set.weightKg,
            reps: set.reps,
          })),
        })),
      })

      setMessage('Seance enregistree.')
      await navigate({ to: '/app/workouts' })
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
        <Card className="rounded-2xl border-border">
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="workoutTitle">Titre</Label>
              <Input
                id="workoutTitle"
                value={workoutTitle}
                onChange={(event) => setWorkoutTitle(event.target.value)}
              />
            </div>
            <Button type="button" variant="pill" onClick={() => void handleStart()}>
              Demarrer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          eyebrow="En cours"
          title={title}
          description={
            isResting
              ? `Repos — ${restSecondsLeft}s`
              : `${activeExercises.length} exercices dans la seance`
          }
        />
        {isResting ? (
          <Pill tone="accent">
            <Timer className="size-3" />
            {restSecondsLeft}s
          </Pill>
        ) : null}
      </div>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Programme</CardTitle>
          <CardDescription>Glissez pour reordonner les exercices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ExercisePicker
            excludeIds={activeExercises.map((exercise) => exercise.exerciseId)}
            onSelect={(exercise) => void addExercise(exercise)}
          />
          <SortableExerciseList
            exercises={activeExercises}
            activeIndex={activeExerciseIndex}
            onSelect={setActiveExerciseIndex}
            onReorder={(from, to) => void reorderExercises(from, to)}
            onRemove={(index) => void removeExercise(index)}
          />
        </CardContent>
      </Card>

      {activeExercise ? (
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">
              {activeExercise.exerciseName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExercisePerformancePanel
              exercise={{
                id: activeExercise.exerciseId,
                name: activeExercise.exerciseName,
                equipment: activeExercise.equipment ?? null,
              }}
              onApplySuggestion={applySuggestion}
            />

            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'warmup', 'failure'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={setType === type ? 'pill' : 'outline'}
                  className="rounded-full capitalize"
                  onClick={() => setSetType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weight">Poids (kg)</Label>
                <Input
                  id="weight"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(event) => setWeightKg(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  inputMode="numeric"
                  value={reps}
                  onChange={(event) => setReps(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="pill" onClick={() => void handleLogSet()}>
                Logger le set
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                onClick={() => startRest(90)}
              >
                Repos 90s
              </Button>
            </div>

            <ul className="space-y-1 font-data text-xs text-muted-foreground">
              {activeExercise.sets.map((set) => (
                <li key={set.setIndex}>
                  Set {set.setIndex + 1} ({set.setType}) — {set.weightKg ?? '—'} kg x{' '}
                  {set.reps ?? '—'} reps
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

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
    </div>
  )
}
