import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, Dumbbell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill } from '@/design-system'
import { countWorkoutSets, useMyWorkouts } from '@/hooks/useWorkouts'

export const Route = createFileRoute('/app/workouts/')({
  component: WorkoutsPage,
})

function WorkoutsPage() {
  const { data: workouts, isLoading, error } = useMyWorkouts()

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Historique"
        title="Vos seances"
        description="Retrouvez vos dernieres seances enregistrees."
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">Timeline</CardTitle>
              <CardDescription>
                Seances synchronisees depuis l&apos;application.
              </CardDescription>
            </div>
            <Pill tone="purple">
              <CalendarDays className="size-3" />
              {workouts?.length ?? 0}
            </Pill>
          </div>
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
            <div className="rounded-2xl border border-dashed border-border bg-soft-primary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune seance enregistree pour le moment.
              </p>
              <Button variant="pill" className="mt-4" asChild>
                <Link to="/app/workout/active">Demarrer une seance</Link>
              </Button>
            </div>
          ) : null}
          <ul className="space-y-3">
            {workouts?.map((workout) => (
              <li
                key={workout.id}
                className="rounded-2xl border border-border bg-card px-4 py-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-black text-foreground">
                      {workout.title}
                    </p>
                    <p className="font-data text-xs text-muted-foreground">
                      {format(new Date(workout.started_at), 'd MMM yyyy HH:mm', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <Pill tone="secondary">
                    {countWorkoutSets(workout)} sets
                  </Pill>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Dumbbell className="size-3" />
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
