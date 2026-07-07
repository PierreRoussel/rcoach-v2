import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { ExerciseStatsPanel } from '@/components/stats/ExerciseStatsPanel'
import { PremiumGate } from '@/components/subscription/PremiumGate'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/design-system'
import { useEntitlement } from '@/hooks/useSubscription'
import { useStatsWorkouts } from '@/hooks/useStatsWorkouts'
import { useAllExercises } from '@/hooks/useExercises'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import { useExerciseProgression } from '@/hooks/useExerciseProgression'
import type { StatsPeriod } from '@/lib/stats/exercise-progression'
import { exercisePeriodToStatsWorkoutFetchPeriod } from '@/lib/stats/stats-workout-period'
import { markStatsScrollToFeatured } from '@/lib/stats/scroll-to-featured'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'

type ExerciseStatsSearch = {
  period?: StatsPeriod
  from?: 'featured'
}

export const Route = createFileRoute('/app/stats/exercises/$exerciseId')({
  validateSearch: (search: Record<string, unknown>): ExerciseStatsSearch => {
    const period = search.period
    const validated: ExerciseStatsSearch = {}

    if (period === '3m' || period === 'month' || period === 'year' || period === 'all') {
      validated.period = period
    } else {
      validated.period = '3m'
    }

    if (search.from === 'featured') {
      validated.from = 'featured'
    }

    return validated
  },
  component: ExerciseStatsDetailPage,
})

function ExerciseStatsDetailPage() {
  const { exerciseId } = Route.useParams()
  const { period = '3m', from } = Route.useSearch()
  const navigate = useNavigate()
  const { workouts, isLoading, error } = useStatsWorkouts(
    exercisePeriodToStatsWorkoutFetchPeriod(period),
  )
  const { data: allExercises = [] } = useAllExercises()

  const { catalogEntry } = useExerciseProgression(workouts, exerciseId, period)

  const exerciseMeta = useMemo(() => {
    if (catalogEntry) {
      return catalogEntry
    }

    const fromCatalog = allExercises.find((exercise) => exercise.id === exerciseId)
    if (!fromCatalog) {
      return null
    }

    return {
      exerciseId: fromCatalog.id,
      name: fromCatalog.name,
      nameFr: fromCatalog.name_fr ?? null,
      muscleGroup: fromCatalog.muscle_group,
      equipment: fromCatalog.equipment,
      sessionCount: 0,
      lastDate: '',
      currentPerformance: null,
    }
  }, [allExercises, catalogEntry, exerciseId])

  const displayExerciseName = useExerciseDisplayName(
    exerciseMeta?.name,
    exerciseMeta?.nameFr,
    exerciseMeta?.exerciseId ?? exerciseId,
  )
  const { entitled: hasAdvancedStats } = useEntitlement('advanced_stats')

  useEffect(() => {
    if (from === 'featured') {
      markStatsScrollToFeatured()
    }
  }, [from])

  function setPeriod(next: StatsPeriod) {
    void navigate({
      to: '/app/stats/exercises/$exerciseId',
      params: { exerciseId },
      search: {
        period: next,
        ...(from === 'featured' ? { from: 'featured' as const } : {}),
      },
    })
  }

  return (
    <div className="space-y-4 pb-8">
      <Button variant="ghost" size="sm" className="-ml-2 rounded-full" asChild>
        <Link
          to="/app/sessions"
          search={{ tab: 'stats' }}
          onClick={() => {
            if (from === 'featured') {
              markStatsScrollToFeatured()
            }
          }}
        >
          <ArrowLeft className="size-4" />
          Statistiques
        </Link>
      </Button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Erreur de chargement'}
        </p>
      ) : null}

      {!isLoading && !error && exerciseMeta ? (
        <>
          <PageHeader
            eyebrow="Exercice"
            title={displayExerciseName || exerciseMeta.name}
            description={
              [
                MUSCLE_GROUP_LABELS[normalizeMuscleGroup(exerciseMeta.muscleGroup)],
                exerciseMeta.equipment,
                catalogEntry
                  ? `${catalogEntry.sessionCount} séance${catalogEntry.sessionCount > 1 ? 's' : ''}`
                  : 'Jamais réalisé',
              ]
                .filter(Boolean)
                .join(' · ')
            }
          />

          <PremiumGate
            entitled={hasAdvancedStats}
            overlayPosition="top"
            blurStrength="strong"
            title="Statistiques avancées"
            description="Passez en Premium pour débloquer les graphiques détaillés et l’historique complet par exercice."
          >
            <ExerciseStatsPanel
              exerciseId={exerciseId}
              period={period}
              onPeriodChange={setPeriod}
              showSummaryLine={false}
            />
          </PremiumGate>
        </>
      ) : null}

      {!isLoading && !error && !exerciseMeta ? (
        <p className="text-sm text-destructive">Exercice introuvable.</p>
      ) : null}
    </div>
  )
}
