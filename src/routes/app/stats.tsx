import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { Activity, Dumbbell, Search, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { WorkoutCalendarPanel } from '@/components/schedule/CalendarDayDetail'
import { BodyHeatmap } from '@/components/stats/BodyHeatmap'
import { ExerciseSearchDrawer } from '@/components/stats/ExerciseSearchDrawer'
import { MuscleRadarChart } from '@/components/stats/MuscleRadarChart'
import { MuscleZoneInsights } from '@/components/stats/MuscleZoneInsights'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader, StatCard } from '@/design-system'
import { useAllMyWorkouts } from '@/hooks/useAllMyWorkouts'
import { useCalendarData } from '@/hooks/useCalendarData'
import { useDetailedStats } from '@/hooks/useDetailedStats'
import { useExerciseCatalogStats } from '@/hooks/useExerciseCatalogStats'
import {
  consumeStatsScrollToFeatured,
  scrollElementIntoViewWhenReady,
} from '@/lib/stats/scroll-to-featured'

export const Route = createFileRoute('/app/stats')({
  component: StatsPage,
})

function StatsPage() {
  const matchRoute = useMatchRoute()
  const featuredSectionRef = useRef<HTMLElement>(null)
  const isExerciseDetail = matchRoute({ to: '/app/stats/exercises/$exerciseId' })
  const {
    workouts,
    isLoading,
    error,
    isFetchingMore,
    isCapped,
    fetchNextPage,
  } = useAllMyWorkouts()
  const { markers, weeklyStreak, isLoading: calendarLoading } = useCalendarData()
  const exerciseCatalog = useExerciseCatalogStats(workouts)
  const [searchOpen, setSearchOpen] = useState(false)
  const {
    weeklyStats,
    radarData,
    bodyIntensities,
    topByZone,
    totalVolume,
    totalSessions,
    activeZones,
  } = useDetailedStats(workouts)

  const hasData = workouts.length > 0

  useEffect(() => {
    if (isExerciseDetail || !hasData || !consumeStatsScrollToFeatured()) {
      return
    }

    return scrollElementIntoViewWhenReady(() => featuredSectionRef.current)
  }, [hasData, isExerciseDetail])

  if (isExerciseDetail) {
    return <Outlet />
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Progression"
        title="Statistiques"
        description="Volume, repartition musculaire et progression par exercice."
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

          <StatCard
            icon={<Dumbbell className="size-4 text-primary" />}
            value={String(activeZones)}
            label="Zones actives"
            sub="groupes musculaires travailles"
            tone="accent"
            className="w-full"
          />

          <ExerciseSearchDrawer
            catalog={exerciseCatalog}
            open={searchOpen}
            onOpenChange={setSearchOpen}
          />

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-display font-black">Calendrier</CardTitle>
                  <CardDescription>
                    Jours avec seance realisee ou planifiee.
                  </CardDescription>
                </div>
                <Button variant="soft" size="sm" className="rounded-full" asChild>
                  <Link to="/app/planning">Planning</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {calendarLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <WorkoutCalendarPanel
                  markers={markers}
                  mode="compact"
                  streak={weeklyStreak}
                />
              )}
            </CardContent>
          </Card>

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
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
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

          {hasData ? (
            <>
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="font-display font-black">
                    Carte musculaire
                  </CardTitle>
                  <CardDescription>
                    Zones les plus sollicitees (volume relatif) — plus fonce = plus
                    travaille.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BodyHeatmap intensities={bodyIntensities} />
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="font-display font-black">
                    Profil en etoile
                  </CardTitle>
                  <CardDescription>
                    Comparaison relative des zones musculaires les plus entrainees.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MuscleRadarChart data={radarData} />
                </CardContent>
              </Card>

              <Card
                ref={featuredSectionRef}
                id="stats-featured-exercises"
                className="rounded-2xl border-border scroll-mt-20"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-display font-black">
                        Exercice phare par zone
                      </CardTitle>
                      <CardDescription>
                        L&apos;exo le plus utilise par muscle, avec estimation de percentile
                        de force (1RM estime vs repères population).
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      className="shrink-0 rounded-full"
                      onClick={() => setSearchOpen(true)}
                    >
                      <Search className="size-4" />
                      Autre
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <MuscleZoneInsights zones={topByZone} />
                  {isFetchingMore ? (
                    <p className="text-xs text-muted-foreground">
                      Chargement de l&apos;historique...
                    </p>
                  ) : null}
                  {isCapped ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => void fetchNextPage()}
                    >
                      Charger plus d&apos;historique
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
