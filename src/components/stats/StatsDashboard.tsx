import { Link } from '@tanstack/react-router'
import { Activity, Dumbbell, Search, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { WorkoutCalendarPanel } from '@/components/schedule/CalendarDayDetail'
import { BodyHeatmap } from '@/components/stats/BodyHeatmap'
import { ExerciseSearchDrawer } from '@/components/stats/ExerciseSearchDrawer'
import { MuscleRadarChart } from '@/components/stats/MuscleRadarChart'
import { MuscleZoneInsights } from '@/components/stats/MuscleZoneInsights'
import { StatsPeriodSelector } from '@/components/stats/StatsPeriodSelector'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatsSummaryCard } from '@/components/stats/StatsSummaryCard'
import { PremiumGate } from '@/components/subscription/PremiumGate'
import { useDetailedStats } from '@/hooks/useDetailedStats'
import { useEntitlement } from '@/hooks/useSubscription'
import { useExerciseCatalogStats } from '@/hooks/useExerciseCatalogStats'
import { useStatsWorkouts } from '@/hooks/useStatsWorkouts'
import type { StatsWorkoutPeriod } from '@/lib/stats/stats-workout-period'
import {
  consumeStatsScrollToFeatured,
  scrollElementIntoViewWhenReady,
} from '@/lib/stats/scroll-to-featured'
import { cn } from '@/lib/utils'
import { useTabPanelActive } from '@/components/sessions/SwipeableTabPanels'

type StatsDashboardProps = {
  className?: string
}

export function StatsDashboard({ className }: StatsDashboardProps) {
  const featuredSectionRef = useRef<HTMLElement>(null)
  const isTabActive = useTabPanelActive()
  const [period, setPeriod] = useState<StatsWorkoutPeriod>('3m')
  const { entitled: hasAdvancedStats } = useEntitlement('advanced_stats')
  const {
    workouts,
    isLoading,
    isLoadingAll,
    error,
  } = useStatsWorkouts(period)
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
    if (!isTabActive || !hasData || !consumeStatsScrollToFeatured()) {
      return
    }

    return scrollElementIntoViewWhenReady(() => featuredSectionRef.current)
  }, [hasData, isTabActive])

  return (
    <div className={cn('space-y-4', className)}>
      <StatsPeriodSelector value={period} onChange={setPeriod} />

      {isLoading || isLoadingAll ? (
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Chargement...'
            : `Chargement de l'historique (${workouts.length} séance${workouts.length > 1 ? 's' : ''})...`}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      {!isLoading && !isLoadingAll && !error ? (
        <PremiumGate
          entitled={hasAdvancedStats}
          title="Statistiques avancées"
          description="Débloquez les graphiques détaillés, la heatmap musculaire et l’analyse complète de votre progression."
        >
          <>
          <div className="grid grid-cols-2 gap-3">
            <StatsSummaryCard
              icon={<Activity className="size-4 stroke-[2.25] text-primary" />}
              value={String(totalSessions)}
              label="Séances"
              sub="total enregistrées"
              tone="primary"
            />
            <StatsSummaryCard
              icon={<TrendingUp className="size-4 stroke-[2.25] text-secondary-foreground" />}
              value={Math.round(totalVolume).toLocaleString('fr-FR')}
              label="Volume"
              sub="kg x reps"
              tone="secondary"
            />
          </div>

          <StatsSummaryCard
            icon={<Dumbbell className="size-4 stroke-[2.25] text-accent" />}
            value={String(activeZones)}
            label="Zones actives"
            sub="groupes musculaires travaillés"
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
                    Jours avec séance réalisée ou planifiée.
                  </CardDescription>
                </div>
                <Button variant="soft" size="sm" className="rounded-full" asChild>
                  <Link to="/app/planning">Planning</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <WorkoutCalendarPanel mode="compact" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-display font-black">
                Volume hebdomadaire
              </CardTitle>
              <CardDescription>
                Répartition du volume d&apos;entrainement par semaine.
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
                  Aucune séance enregistrée pour le moment.
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
                className="scroll-mt-20 rounded-2xl border-border"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-display font-black">
                        Exercice phare par zone
                      </CardTitle>
                      <CardDescription>
                        L&apos;exo le plus utilisé par muscle, avec estimation de percentile
                        de force (1RM estimé vs repères population).
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
                </CardContent>
              </Card>
            </>
          ) : null}
          </>
        </PremiumGate>
      ) : null}
    </div>
  )
}
