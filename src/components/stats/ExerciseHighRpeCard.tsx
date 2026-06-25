import { TrendingUp } from 'lucide-react'

import { Pill } from '@/design-system'
import type { HighRpeComparison } from '@/lib/stats/rpe-analytics'
import {
  formatHighRpeComparison,
  HIGH_RPE_THRESHOLD,
} from '@/lib/stats/rpe-analytics'

type ExerciseHighRpeCardProps = {
  comparison: HighRpeComparison
  rpeEnabled: boolean
}

export function ExerciseHighRpeCard({
  comparison,
  rpeEnabled,
}: ExerciseHighRpeCardProps) {
  const message = formatHighRpeComparison(comparison)

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-soft-accent/30 p-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-accent-foreground" />
        <p className="font-display text-sm font-black">
          Performance RPE eleve (≥ {HIGH_RPE_THRESHOLD})
        </p>
      </div>

      {!rpeEnabled ? (
        <p className="text-xs text-muted-foreground">
          Activez le RPE dans votre profil pour enrichir l&apos;analyse.
        </p>
      ) : null}

      {comparison.currentSetLabel ? (
        <p className="font-data text-sm text-foreground">{comparison.currentSetLabel}</p>
      ) : null}

      <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>

      {comparison.currentOneRm != null && comparison.baselineOneRm != null ? (
        <div className="flex flex-wrap gap-2">
          <Pill tone="primary">
            {comparison.currentPeriodLabel ?? 'Recent'} :{' '}
            {Math.round(comparison.currentOneRm)} kg est.
          </Pill>
          <Pill tone="secondary">
            {comparison.baselinePeriodLabel ?? 'Debut'} :{' '}
            {Math.round(comparison.baselineOneRm)} kg est.
          </Pill>
          {comparison.deltaKg != null ? (
            <Pill tone={comparison.deltaKg >= 0 ? 'accent' : 'purple'}>
              {comparison.deltaKg >= 0 ? '+' : ''}
              {comparison.deltaKg.toFixed(1)} kg
            </Pill>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
