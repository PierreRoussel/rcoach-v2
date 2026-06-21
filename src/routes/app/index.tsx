import { createFileRoute, Link } from '@tanstack/react-router'
import { Dumbbell, History, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill } from '@/design-system'
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
      <section className="rounded-3xl bg-gradient-hero border border-border p-5">
        <PageHeader
          eyebrow="Athlete"
          title="Move with joy"
          description="Lancez une seance, suivez votre progression et importez vos donnees Hevy."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="pill" asChild>
            <Link to="/app/workout/active">
              {startedAt ? 'Reprendre la seance' : 'Demarrer une seance'}
            </Link>
          </Button>
          <Button variant="soft" asChild>
            <Link to="/app/workouts">
              <History className="size-4" />
              Historique
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/app/exercises">
              <Dumbbell className="size-4" />
              Catalogue
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/app/import">
              <Upload className="size-4" />
              Import Hevy
            </Link>
          </Button>
        </div>
      </section>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">
                Bibliotheque publique
              </CardTitle>
              <CardDescription>
                Exercices systeme disponibles pour vos seances.
              </CardDescription>
            </div>
            <Pill tone="secondary">
              <Dumbbell className="size-3" />
              {exercises?.length ?? 0}
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
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {exercises?.slice(0, 12).map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-soft-primary/40 px-3 py-2.5"
              >
                <span className="font-medium">{exercise.name}</span>
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
