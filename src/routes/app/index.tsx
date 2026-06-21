import { createFileRoute, Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePublicExercises } from '@/hooks/useProfile'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'

export const Route = createFileRoute('/app/')({
  component: AppHomePage,
})

function AppHomePage() {
  const { data: exercises, isLoading, error } = usePublicExercises()
  const startedAt = useActiveWorkoutStore((state) => state.startedAt)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Seance</CardTitle>
          <CardDescription>
            Lancez une seance active ou consultez votre historique.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/app/workout/active">
              {startedAt ? 'Reprendre la seance' : 'Demarrer une seance'}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/workouts">Historique</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/import">Import Hevy</Link>
          </Button>
        </CardContent>
      </Card>

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
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {exercises?.slice(0, 12).map((exercise) => (
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
