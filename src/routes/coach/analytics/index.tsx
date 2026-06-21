import { createFileRoute } from '@tanstack/react-router'
import { Activity, Dumbbell, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, Pill, StatCard } from '@/design-system'
import {
  computeWeeklyVolumeByClient,
  useClientWorkouts,
  useCoachClients,
} from '@/hooks/useCoach'

export const Route = createFileRoute('/coach/analytics/')({
  component: CoachAnalyticsPage,
})

function CoachAnalyticsPage() {
  const { data: clients } = useCoachClients()
  const { data: workouts, isLoading, error } = useClientWorkouts(100)

  const activeClients =
    clients?.filter((client) => client.status === 'active').length ?? 0
  const volumeByClient = computeWeeklyVolumeByClient(workouts ?? [])
  const totalSessions = workouts?.length ?? 0

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Coach"
        title="Analytics"
        description="Volume et activite recente de vos clients actifs."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Users className="size-4" />}
          label="Clients actifs"
          value={String(activeClients)}
          tone="primary"
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Seances recentes"
          value={String(totalSessions)}
          tone="secondary"
        />
        <StatCard
          icon={<Dumbbell className="size-4" />}
          label="Volume total (kg·reps)"
          value={String(
            Math.round(volumeByClient.reduce((sum, row) => sum + row.volume, 0)),
          )}
          tone="accent"
        />
      </div>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">
            Volume par client
          </CardTitle>
          <CardDescription>
            Somme poids x reps sur les seances visibles (hors echauffement).
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Erreur'}
            </p>
          ) : null}
          {volumeByClient.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">
              Aucune donnee — activez des clients et attendez leurs seances.
            </p>
          ) : null}
          {volumeByClient.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeByClient}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="volume" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">
            Seances recentes
          </CardTitle>
          <CardDescription>Dernieres seances de vos clients actifs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workouts?.slice(0, 15).map((workout) => (
            <div
              key={workout.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
            >
              <div>
                <p className="font-display font-bold">{workout.title}</p>
                <p className="text-xs text-muted-foreground">
                  {workout.user.display_name} ·{' '}
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
    </div>
  )
}
