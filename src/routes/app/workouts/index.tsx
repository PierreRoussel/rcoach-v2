import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { countWorkoutSets, useMyWorkouts } from '@/hooks/useWorkouts'

export const Route = createFileRoute('/app/workouts/')({
  component: WorkoutsPage,
})

function WorkoutsPage() {
  const { data: workouts, isLoading, error } = useMyWorkouts()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>Vos dernieres seances enregistrees.</CardDescription>
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
          {!isLoading && !error && workouts?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune seance.{' '}
              <Link to="/app/workout/active" className="underline">
                Demarrer une seance
              </Link>
            </p>
          ) : null}
          <ul className="space-y-2">
            {workouts?.map((workout) => (
              <li key={workout.id} className="rounded-md border px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{workout.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(workout.started_at), 'd MMM yyyy HH:mm', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {countWorkoutSets(workout)} sets
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {workout.workout_exercises.length} exercices
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
