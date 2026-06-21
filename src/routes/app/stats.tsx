import { createFileRoute } from '@tanstack/react-router'
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
import { useMyWorkouts, useWorkoutStats } from '@/hooks/useWorkouts'

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
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
          <CardDescription>
            Volume hebdomadaire (kg x reps) et nombre de seances.
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
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Seances</p>
                  <p className="text-2xl font-semibold">{totalSessions}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Volume total</p>
                  <p className="text-2xl font-semibold">
                    {Math.round(totalVolume).toLocaleString('fr-FR')} kg
                  </p>
                </div>
              </div>
              {weeklyStats.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="volume" fill="#171717" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune seance enregistree pour le moment.
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
