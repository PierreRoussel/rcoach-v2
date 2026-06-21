import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { usePublicExercises } from '@/hooks/useProfile'
import { insertSampleWorkout } from '@/lib/graphql/workout-test'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/app/')({
  component: AppHomePage,
})

function AppHomePage() {
  const { nhost } = useAuth()
  const { data: exercises, isLoading, error, refetch } = usePublicExercises()
  const [workoutMessage, setWorkoutMessage] = useState<string | null>(null)
  const [workoutError, setWorkoutError] = useState<string | null>(null)
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false)

  async function handleCreateTestWorkout() {
    const firstExercise = exercises?.find(
      (exercise) => exercise.name !== 'Warm Up',
    )

    if (!firstExercise) {
      setWorkoutError('Aucun exercice disponible pour le test.')
      return
    }

    setWorkoutError(null)
    setWorkoutMessage(null)
    setIsCreatingWorkout(true)

    try {
      const workout = await insertSampleWorkout(nhost, firstExercise.id)
      setWorkoutMessage(`Seance creee : ${workout?.title ?? 'OK'} (${workout?.id})`)
    } catch (insertError) {
      setWorkoutError(
        insertError instanceof Error
          ? insertError.message
          : 'Echec de la mutation test',
      )
    } finally {
      setIsCreatingWorkout(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bibliotheque publique</CardTitle>
          <CardDescription>
            Exercices systeme disponibles pour vos seances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Erreur de chargement'}
            </p>
          ) : null}
          {!isLoading && !error ? (
            <p className="mb-3 text-sm text-muted-foreground">
              {exercises?.length ?? 0} exercices publics
            </p>
          ) : null}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              Rafraichir
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isCreatingWorkout || !exercises?.length}
              onClick={() => void handleCreateTestWorkout()}
            >
              {isCreatingWorkout ? 'Creation...' : 'Test nested workout'}
            </Button>
          </div>
          {workoutMessage ? (
            <p className="mb-3 text-sm text-green-700">{workoutMessage}</p>
          ) : null}
          {workoutError ? <FormMessage>{workoutError}</FormMessage> : null}
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {exercises?.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>{exercise.name}</span>
                <span className="text-xs text-muted-foreground">
                  {exercise.muscle_group ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
