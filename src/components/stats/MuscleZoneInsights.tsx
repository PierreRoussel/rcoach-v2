import { Trophy } from 'lucide-react'

import { Pill } from '@/design-system'
import type { TopExerciseByZone } from '@/lib/stats/analytics'

type MuscleZoneInsightsProps = {
  zones: TopExerciseByZone[]
}

function percentileTone(percentile: number): 'primary' | 'secondary' | 'accent' | 'purple' | 'default' {
  if (percentile >= 90) {
    return 'purple'
  }
  if (percentile >= 75) {
    return 'primary'
  }
  if (percentile >= 50) {
    return 'secondary'
  }
  return 'default'
}

export function MuscleZoneInsights({ zones }: MuscleZoneInsightsProps) {
  if (zones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun exercice enregistre par zone pour le moment.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {zones.map((zone) => (
        <div
          key={zone.muscle}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {zone.label}
              </p>
              <p className="font-display font-black text-foreground">{zone.exerciseName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {zone.sets} sets · {Math.round(zone.volume).toLocaleString('fr-FR')} kg·reps
              </p>
            </div>

            {zone.strength ? (
              <div className="text-right">
                <Pill tone={percentileTone(zone.strength.percentile)}>
                  <Trophy className="size-3" />
                  {zone.strength.percentile}e percentile
                </Pill>
                <p className="mt-2 text-xs font-semibold text-primary">
                  {zone.strength.tierLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  1RM est. {zone.strength.oneRmKg} kg
                  {zone.strength.isEstimated ? ' · repere zone' : ''}
                </p>
              </div>
            ) : (
              <Pill tone="default">Force N/A</Pill>
            )}
          </div>

          {zone.strength ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${zone.strength.percentile}%` }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
