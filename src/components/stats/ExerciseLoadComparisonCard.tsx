import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { Pill } from '@/design-system'
import type { LoadProgressComparison } from '@/lib/stats/exercise-progression'
import { cn } from '@/lib/utils'

type ExerciseLoadComparisonCardProps = {
  comparison: LoadProgressComparison
}

function metricCaption(metric: LoadProgressComparison['metric']) {
  if (metric === 'reps') {
    return 'Meilleures reps'
  }

  return 'Meilleure charge'
}

export function ExerciseLoadComparisonCard({
  comparison,
}: ExerciseLoadComparisonCardProps) {
  if (!comparison.hasEnoughData) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/15 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Pas encore assez de données pour comparer le debut et la fin de cette période.
        </p>
        {comparison.currentLabel ? (
          <p className="mt-2 font-data text-sm text-foreground">
            Dernier pic : {comparison.currentLabel}
          </p>
        ) : null}
      </div>
    )
  }

  const improved = comparison.delta != null && comparison.delta > 0
  const declined = comparison.delta != null && comparison.delta < 0
  const stable = comparison.delta === 0
  const caption = metricCaption(comparison.metric)
  const unit = comparison.metric === 'reps' ? 'reps' : 'kg'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-soft-secondary/50 via-card to-soft-primary/35 p-5 shadow-sm">
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 size-28 rounded-full bg-secondary/15 blur-2xl"
        aria-hidden
      />

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="space-y-1 text-center">
          <p className="font-data text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {comparison.baselinePeriodLabel}
          </p>
          <p className="font-display text-3xl font-black leading-none text-foreground/80">
            {comparison.baselineLabel}
          </p>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-full border bg-background/80 shadow-sm',
              improved && 'border-primary/30 text-primary',
              declined && 'border-destructive/30 text-destructive',
              stable && 'border-border text-muted-foreground',
            )}
          >
            {improved ? (
              <TrendingUp className="size-4" />
            ) : declined ? (
              <TrendingDown className="size-4" />
            ) : (
              <Minus className="size-4" />
            )}
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
          {comparison.delta != null ? (
            <Pill
              tone={improved ? 'primary' : declined ? 'purple' : 'default'}
              className="font-data text-[10px]"
            >
              {comparison.delta > 0 ? '+' : ''}
              {comparison.delta} {unit}
              {comparison.deltaPercent != null ? ` · ${comparison.deltaPercent > 0 ? '+' : ''}${comparison.deltaPercent}%` : ''}
            </Pill>
          ) : null}
        </div>

        <div className="space-y-1 text-center">
          <p className="font-data text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {comparison.currentPeriodLabel}
          </p>
          <p className="font-display text-3xl font-black leading-none text-foreground">
            {comparison.currentLabel}
          </p>
          <p className="text-xs font-medium text-soft-primary-fg">{caption}</p>
        </div>
      </div>
    </div>
  )
}
