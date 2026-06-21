import { createFileRoute } from '@tanstack/react-router'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader, StatCard } from '@/design-system'
import { useMyWorkouts, useWorkoutStats } from '@/hooks/useWorkouts'
import { Activity, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/app/stats')({
  component: StatsPage,
})

function StatsPage() {
  const { data: workouts, isLoading, error } = useMyWorkouts()
  const weeklyStats = useWorkoutStats(workouts)

  const totalVolume = weeklyStats.reduce((sum, point) => sum + point.volume, 0)
  const totalSessions = workouts?.length ?? 0

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Progression"
        title="Statistiques"
        description="Volume hebdomadaire et nombre de seances enregistrees."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      {!isLoading && !error ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Activity className="size-4 text-primary" />}
              value={String(totalSessions)}
              label="Seances"
              sub="total enregistrees"
              tone="primary"
            />
            <StatCard
              icon={<TrendingUp className="size-4 text-secondary-foreground" />}
              value={Math.round(totalVolume).toLocaleString('fr-FR')}
              label="Volume"
              sub="kg x reps"
              tone="secondary"
            />
          </div>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-display font-black">
                Volume hebdomadaire
              </CardTitle>
              <CardDescription>
                Repartition du volume d&apos;entrainement par semaine.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyStats.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,166,0.12)" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="volume" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune seance enregistree pour le moment.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
