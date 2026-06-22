import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pill } from '@/design-system'
import type { ClientWorkout } from '@/lib/graphql/operations'

type CoachRecentSessionsProps = {
  workouts: ClientWorkout[]
}

export function CoachRecentSessions({ workouts }: CoachRecentSessionsProps) {
  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="font-display font-black">
              Activite recente
            </CardTitle>
            <CardDescription>
              Dernieres seances de vos clients actifs.
            </CardDescription>
          </div>
          <Button variant="soft" size="sm" className="rounded-full" asChild>
            <Link to="/coach/analytics">Voir tout</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {workouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune seance recente a afficher.
          </p>
        ) : null}
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
          >
            <div>
              <p className="font-display font-bold">{workout.title}</p>
              <p className="text-xs text-muted-foreground">
                {workout.user.display_name || 'Client'} ·{' '}
                {new Date(workout.started_at).toLocaleString('fr-FR')}
              </p>
            </div>
            <Pill tone="default">
              {workout.workout_exercises.length} exo(s)
            </Pill>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
