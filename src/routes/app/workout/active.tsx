import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'

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
import { usePublicExercises } from '@/hooks/useProfile'
import { syncWorkoutDraft } from '@/lib/graphql/sync-queue'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export const Route = createFileRoute('/app/workout/active')({
  component: ActiveWorkoutPage,
})

function ActiveWorkoutPage() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const { data: exercises } = usePublicExercises()
  const {
    title,
    startedAt,
    exercises: activeExercises,
    restSecondsLeft,
    isResting,
    hydrate,
    startWorkout,
    addExercise,
    addSet,
    startRest,
    tickRest,
    finishWorkout,
    cancelWorkout,
  } = useActiveWorkoutStore()

  const [workoutTitle, setWorkoutTitle] = useState('Seance libre')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [reps, setReps] = useState('')
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  async function handleStart() {
    setError(null)
    await startWorkout(workoutTitle.trim() || 'Seance libre')
  }

  async function handleAddExercise() {
    const exercise = exercises?.find((item) => item.id === selectedExerciseId)
    if (!exercise) {
      setError('Selectionnez un exercice.')
      return
    }

    setError(null)
    await addExercise(exercise)
    setActiveExerciseIndex(useActiveWorkoutStore.getState().exercises.length - 1)
    setSelectedExerciseId('')
  }

  async function handleLogSet() {
    if (activeExercises.length === 0) {
      setError('Ajoutez un exercice avant de logger un set.')
      return
    }

    setError(null)
    await addSet(activeExerciseIndex, {
      setType: 'normal',
      weightKg: weightKg ? Number(weightKg) : null,
      reps: reps ? Number(reps) : null,
    })
    setWeightKg('')
    setReps('')
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
          description="Demarrez une seance avec timer de repos integre."
        />
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">
              Configuration
            </CardTitle>
            <CardDescription>
              Donnez un titre a votre seance avant de commencer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              ? `Repos en cours — ${restSecondsLeft}s restantes`
              : 'Loggez vos sets et enregistrez la seance.'
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
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="exercise">Exercice</Label>
            <select
              id="exercise"
              className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
              value={selectedExerciseId}
              onChange={(event) => setSelectedExerciseId(event.target.value)}
            >
              <option value="">Choisir...</option>
              {exercises?.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="soft"
              onClick={() => void handleAddExercise()}
            >
              Ajouter l&apos;exercice
            </Button>
          </div>

          {activeExercises.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="activeExercise">Exercice actif</Label>
              <select
                id="activeExercise"
                className="flex h-9 w-full rounded-xl border border-border bg-input-background px-3 text-sm"
                value={activeExerciseIndex}
                onChange={(event) =>
                  setActiveExerciseIndex(Number(event.target.value))
                }
              >
                {activeExercises.map((exercise, index) => (
                  <option key={`${exercise.exerciseId}-${index}`} value={index}>
                    {exercise.exerciseName} ({exercise.sets.length} sets)
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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
            <Button
              type="button"
              variant="default"
              className="rounded-full"
              disabled={isSaving}
              onClick={() => void handleFinish()}
            >
              {isSaving ? 'Enregistrement...' : 'Terminer'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void cancelWorkout()}
            >
              Annuler
            </Button>
          </div>

          {message ? (
            <p className="text-sm text-secondary-foreground">{message}</p>
          ) : null}
          {error ? <FormMessage>{error}</FormMessage> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Recap</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activeExercises.length === 0 ? (
            <p className="text-muted-foreground">Aucun exercice ajoute.</p>
          ) : (
            activeExercises.map((exercise, index) => (
              <div
                key={`${exercise.exerciseId}-${index}`}
                className="rounded-2xl bg-soft-primary/40 p-3"
              >
                <p className="font-display font-black">{exercise.exerciseName}</p>
                <ul className="mt-1 space-y-1 font-data text-xs text-muted-foreground">
                  {exercise.sets.map((set) => (
                    <li key={set.setIndex}>
                      Set {set.setIndex + 1} — {set.weightKg ?? '—'} kg x{' '}
                      {set.reps ?? '—'} reps
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link to="/app">Retour home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
