import { Check, Clock, Flame } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useActiveWorkoutElapsed } from '@/hooks/useActiveWorkoutElapsed'
import {
  computeDraftVolume,
  estimateWorkoutCalories,
} from '@/lib/stats/workout-metrics'
import {
  computeWorkoutProgressPercent,
  countCompletedSets,
  countPlannedSets,
  getValidatedExercisesForSync,
  type CircuitExercise,
} from '@/lib/workout/workout-circuit'
import { cn } from '@/lib/utils'

const RING_SIZE = 52
const STROKE_WIDTH = 4
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2

type ActiveWorkoutSummaryTileProps = {
  startedAt: string
  exercises: CircuitExercise[]
  currentExerciseLabel?: string | null
  bodyWeightKg?: number | null
  className?: string
}

function WorkoutProgressRing({ percent }: { percent: number }) {
  const center = RING_SIZE / 2
  const circumference = 2 * Math.PI * RING_RADIUS
  const dashOffset = circumference * (1 - Math.min(percent, 100) / 100)

  return (
    <div
      className="relative grid size-[52px] shrink-0 place-items-center"
      aria-hidden
    >
      <svg
        className="col-start-1 row-start-1 -rotate-90"
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      >
        <circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          className="text-muted/35"
        />
        <circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
    </div>
  )
}

function InlineStat({
  icon: Icon,
  value,
  iconClassName,
  ariaLabel,
}: {
  icon: typeof Clock
  value: string
  iconClassName?: string
  ariaLabel: string
}) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5"
      aria-label={ariaLabel}
    >
      <Icon className={cn('size-4 shrink-0', iconClassName)} aria-hidden />
      <span className="font-display text-sm font-black tabular-nums text-foreground">
        {value}
      </span>
    </div>
  )
}

export function ActiveWorkoutSummaryTile({
  startedAt,
  exercises,
  currentExerciseLabel,
  bodyWeightKg,
  className,
}: ActiveWorkoutSummaryTileProps) {
  const elapsed = useActiveWorkoutElapsed(startedAt)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()

    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  const completedSets = countCompletedSets(exercises)
  const totalSets = countPlannedSets(exercises)
  const progressPercent = Math.round(computeWorkoutProgressPercent(exercises))

  const estimatedCalories = useMemo(() => {
    const validated = getValidatedExercisesForSync(exercises)

    return estimateWorkoutCalories({
      startedAt,
      endedAt: now.toISOString(),
      volumeKg: computeDraftVolume(validated),
      completedSets,
      bodyWeightKg,
    })
  }, [bodyWeightKg, completedSets, exercises, now, startedAt])

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm',
        className,
      )}
      aria-label="Récapitulatif de la séance en cours"
    >
      <div className="flex items-center gap-3">
        <WorkoutProgressRing percent={progressPercent} />

        <div className="min-w-0 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Progression
          </p>
          <p className="font-display text-sm font-black text-foreground">
            {progressPercent}% complété
          </p>
        </div>

        <div className="h-11 w-px shrink-0 bg-border" aria-hidden />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <InlineStat
            icon={Clock}
            iconClassName="text-primary"
            value={elapsed ?? '0:00'}
            ariaLabel={`Durée écoulée : ${elapsed ?? '0:00'}`}
          />
          <div className="h-8 w-px shrink-0 bg-border" aria-hidden />
          <InlineStat
            icon={Flame}
            iconClassName="text-[#ff6b35]"
            value={estimatedCalories.toLocaleString('fr-FR')}
            ariaLabel={`Calories estimées : ${estimatedCalories}`}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">En cours :</span>{' '}
          {currentExerciseLabel ?? 'Aucun exercice'}
        </p>
        <p className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-soft-secondary text-secondary"
            aria-hidden
          >
            <Check className="size-3" strokeWidth={2.5} />
          </span>
          <span>
            <span className="font-semibold text-foreground tabular-nums">
              {completedSets}/{totalSets}
            </span>{' '}
            séries validées
          </span>
        </p>
      </div>
    </div>
  )
}
