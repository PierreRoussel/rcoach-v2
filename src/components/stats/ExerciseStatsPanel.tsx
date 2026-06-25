import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMemo } from 'react'

import { ExerciseHighRpeCard } from '@/components/stats/ExerciseHighRpeCard'
import { ExerciseLoadComparisonCard } from '@/components/stats/ExerciseLoadComparisonCard'
import { ExercisePeriodSelector } from '@/components/stats/ExercisePeriodSelector'
import { ExerciseProgressChart } from '@/components/stats/ExerciseProgressChart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pill } from '@/design-system'
import { useAllMyWorkouts } from '@/hooks/useAllMyWorkouts'
import { useAllExercises } from '@/hooks/useExercises'
import { useExerciseProgression } from '@/hooks/useExerciseProgression'
import { useMyProfile } from '@/hooks/useProfile'
import type { StatsPeriod } from '@/lib/stats/exercise-progression'
import { MUSCLE_GROUP_LABELS, normalizeMuscleGroup } from '@/lib/stats/muscle-groups'

type ExerciseStatsPanelProps = {
  exerciseId: string
  fallbackName?: string
  fallbackMuscleGroup?: string | null
  fallbackEquipment?: string | null
  period: StatsPeriod
  onPeriodChange: (period: StatsPeriod) => void
  showSummaryLine?: boolean
}

export function ExerciseStatsPanel({
  exerciseId,
  fallbackName,
  fallbackMuscleGroup,
  fallbackEquipment,
  period,
  onPeriodChange,
  showSummaryLine = true,
}: ExerciseStatsPanelProps) {
  const { data: profile } = useMyProfile()
  const rpeEnabled = profile?.rpe_enabled ?? false
  const { workouts, isLoading, error } = useAllMyWorkouts()
  const { data: allExercises = [] } = useAllExercises()

  const {
    catalogEntry,
    timeline,
    sessions,
    bestPerformance,
    highRpeComparison,
    loadComparison,
  } = useExerciseProgression(workouts, exerciseId, period)

  const exerciseMeta = useMemo(() => {
    if (catalogEntry) {
      return catalogEntry
    }

    const fromCatalog = allExercises.find((exercise) => exercise.id === exerciseId)
    if (!fromCatalog) {
      if (!fallbackName) {
        return null
      }

      return {
        exerciseId,
        name: fallbackName,
        muscleGroup: fallbackMuscleGroup ?? null,
        equipment: fallbackEquipment ?? null,
        sessionCount: 0,
        lastDate: '',
        currentPerformance: null,
      }
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
  }, [
    allExercises,
    catalogEntry,
    exerciseId,
    fallbackEquipment,
    fallbackMuscleGroup,
    fallbackName,
  ])

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : 'Erreur de chargement'}
      </p>
    )
  }

  if (!exerciseMeta) {
    return <p className="text-sm text-destructive">Exercice introuvable.</p>
  }

  return (
    <div className="space-y-4">
      {showSummaryLine ? (
        <p className="text-sm text-muted-foreground">
          {[
            MUSCLE_GROUP_LABELS[normalizeMuscleGroup(exerciseMeta.muscleGroup)],
            exerciseMeta.equipment,
            catalogEntry
              ? `${catalogEntry.sessionCount} seance${catalogEntry.sessionCount > 1 ? 's' : ''}`
              : 'Jamais realise',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      ) : null}

      <ExercisePeriodSelector value={period} onChange={onPeriodChange} />

      {catalogEntry == null ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/15 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Cet exercice n&apos;a pas encore ete realise dans une seance enregistree.
          </p>
        </div>
      ) : (
        <>
          <ExerciseLoadComparisonCard comparison={loadComparison} />

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-display font-black">
                Performance actuelle
              </CardTitle>
              <CardDescription>
                Meilleure serie sur la periode selectionnee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-data text-2xl font-bold">
                {bestPerformance.label ?? '—'}
              </p>
              {bestPerformance.date ? (
                <p className="text-xs text-muted-foreground">
                  Pic de la periode · {bestPerformance.date}
                </p>
              ) : null}
              {bestPerformance.best1Rm != null ? (
                <Pill tone="primary">
                  {Math.round(bestPerformance.best1Rm)} kg est. 1RM
                </Pill>
              ) : null}
            </CardContent>
          </Card>

          <ExerciseHighRpeCard
            comparison={highRpeComparison}
            rpeEnabled={rpeEnabled}
          />

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-display font-black">Progression</CardTitle>
              <CardDescription>
                Evolution du 1RM estime par seance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExerciseProgressChart timeline={timeline} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="font-display font-black">
                Seances recentes
              </CardTitle>
              <CardDescription>
                Les 10 dernieres occurrences dans la periode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune seance sur cette periode.
                </p>
              ) : (
                <ul className="divide-y divide-border/70 rounded-xl border border-border">
                  {sessions.map((session) => (
                    <li
                      key={`${session.workoutId}-${session.date}`}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium capitalize text-muted-foreground">
                          {format(parseISO(session.date), 'EEE d MMM yyyy', {
                            locale: fr,
                          })}
                        </p>
                        <p className="truncate text-sm font-display font-bold">
                          {session.workoutTitle}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-data text-xs font-medium">
                          {session.topSetLabel ?? '—'}
                        </p>
                        {session.maxRpe != null ? (
                          <p className="text-[10px] text-muted-foreground">
                            RPE max {session.maxRpe}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
