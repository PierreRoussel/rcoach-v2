import { Link } from '@tanstack/react-router'
import { CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WorkoutHistoryCard } from '@/components/workout/WorkoutHistoryCard'
import { Pill } from '@/design-system'
import { useMyProfile } from '@/hooks/useProfile'
import { useMyWorkouts } from '@/hooks/useWorkouts'

type RecentWorkoutsFeedProps = {
  limit?: number
  showViewAll?: boolean
  title?: string
  description?: string
}

export function RecentWorkoutsFeed({
  limit,
  showViewAll = false,
  title = 'Dernieres seances',
  description = 'Vos seances recentes en un coup d oeil.',
}: RecentWorkoutsFeedProps) {
  const { data: workouts, isLoading, error } = useMyWorkouts()
  const { data: profile } = useMyProfile()
  const visibleWorkouts = limit != null ? workouts?.slice(0, limit) : workouts

  return (
    <Card className="rounded-2xl border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="font-display font-black">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Pill tone="purple">
            <CalendarDays className="size-3" />
            {workouts?.length ?? 0}
          </Pill>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
          {visibleWorkouts?.map((workout) => (
            <li key={workout.id}>
              <WorkoutHistoryCard
                workout={workout}
                profile={profile}
                allWorkouts={workouts ?? []}
              />
            </li>
          ))}
        </ul>
        {showViewAll && (workouts?.length ?? 0) > 0 ? (
          <Button variant="soft" size="sm" className="w-full rounded-full" asChild>
            <Link to="/app/sessions" search={{ tab: 'history' }}>
              Voir tout
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
