import { Link } from '@tanstack/react-router'
import { CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
  title = 'Dernières séances',
}: RecentWorkoutsFeedProps) {
  const { data: workouts, isLoading, error } = useMyWorkouts()
  const { data: profile } = useMyProfile()
  const visibleWorkouts = limit != null ? workouts?.slice(0, limit) : workouts

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border-border shadow-sm">
      <CardHeader className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="font-display font-black">{title}</CardTitle>
          </div>
          <Pill tone="purple">
            <CalendarDays className="size-3" />
            {workouts?.length ?? 0}
          </Pill>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 px-0 pb-0">
        {isLoading ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">Chargement...</p>
        ) : null}
        {error ? (
          <p className="px-4 pb-4 text-sm text-destructive">
            {error instanceof Error ? error.message : 'Erreur de chargement'}
          </p>
        ) : null}
        {!isLoading && !error && workouts?.length === 0 ? (
          <div className="mx-4 mb-4 rounded-2xl border border-dashed border-border bg-soft-primary/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune séance enregistrée pour le moment.
            </p>
            <Button variant="pill" className="mt-4" asChild>
              <Link to="/app/workout/active">Démarrer une séance</Link>
            </Button>
          </div>
        ) : null}
        <ul className="w-full divide-y divide-border border-t border-border">
          {visibleWorkouts?.map((workout) => (
            <li key={workout.id} className="w-full">
              <WorkoutHistoryCard
                workout={workout}
                profile={profile}
                allWorkouts={workouts ?? []}
                variant="embedded"
              />
            </li>
          ))}
        </ul>
        {showViewAll && (workouts?.length ?? 0) > 0 ? (
          <div className="border-t border-border px-4 py-3">
            <Button variant="soft" size="sm" className="w-full rounded-full" asChild>
              <Link to="/app/sessions" search={{ tab: 'history' }}>
                Voir tout
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
