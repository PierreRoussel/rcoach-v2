import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { ExerciseStatsPanel } from '@/components/stats/ExerciseStatsPanel'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/design-system'
import { useAllMyWorkouts } from '@/hooks/useAllMyWorkouts'
import { useAllExercises } from '@/hooks/useExercises'
import { useExerciseDisplayName } from '@/hooks/useExerciseDisplayName'
import { useExerciseProgression } from '@/hooks/useExerciseProgression'
import type { StatsPeriod } from '@/lib/stats/exercise-progression'
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
  const { workouts, isLoading, error } = useAllMyWorkouts()
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
      muscleGroup: fromCatalog.muscle_group,
      equipment: fromCatalog.equipment,
      sessionCount: 0,
      lastDate: '',
      currentPerformance: null,
    }
  }, [allExercises, catalogEntry, exerciseId])

  const displayExerciseName = useExerciseDisplayName(exerciseMeta?.name)

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
                  ? `${catalogEntry.sessionCount} seance${catalogEntry.sessionCount > 1 ? 's' : ''}`
                  : 'Jamais realise',
              ]
                .filter(Boolean)
                .join(' · ')
            }
          />

          <ExerciseStatsPanel
            exerciseId={exerciseId}
            period={period}
            onPeriodChange={setPeriod}
            showSummaryLine={false}
          />
        </>
      ) : null}

      {!isLoading && !error && !exerciseMeta ? (
        <p className="text-sm text-destructive">Exercice introuvable.</p>
      ) : null}
    </div>
  )
}
