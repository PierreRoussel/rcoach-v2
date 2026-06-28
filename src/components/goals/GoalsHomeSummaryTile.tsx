import { Link } from '@tanstack/react-router'
import { ChevronRight, Target } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Progress } from '@/components/ui/progress'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useUserMeasurements } from '@/hooks/useUserMeasurements'
import { useWeightGoal } from '@/hooks/useWeightGoal'
import {
  formatWeightKg,
  goalProgressPercent,
  projectWeightGoalCompletion,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'
import { cn } from '@/lib/utils'

export function GoalsHomeSummaryTile() {
  const { data: goal, isLoading: goalLoading } = useWeightGoal()
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: userMeasurements } = useUserMeasurements()

  const projection =
    goal && nutritionSettings
      ? projectWeightGoalCompletion(goal, nutritionSettings, new Date(), userMeasurements)
      : null

  return (
    <Link
      to="/app/goals"
      className={cn(
        'block rounded-2xl border border-secondary/20 bg-gradient-to-br from-soft-secondary/75 via-card to-soft-secondary/35 px-3.5 py-3 shadow-sm',
        'transition-colors active:bg-muted/40',
      )}
      aria-label="Ouvrir la page objectifs"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-soft-secondary text-secondary-foreground">
          <Target className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-bold text-foreground">
              Objectif poids
            </p>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </div>

          {goalLoading ? (
            <div className="mt-2 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-1.5 animate-pulse rounded-full bg-muted" />
            </div>
          ) : !goal ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Définissez votre objectif poids pour suivre votre progression.
            </p>
          ) : (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                <span>
                  <span className="font-display text-base font-black tabular-nums text-foreground">
                    {formatWeightKg(goal.current_weight_kg)}
                  </span>
                  <span className="ml-1 text-muted-foreground">actuel</span>
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span>
                  <span className="font-display text-base font-black tabular-nums text-foreground">
                    {formatWeightKg(goal.target_weight_kg)}
                  </span>
                  <span className="ml-1 text-muted-foreground">cible</span>
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]}
                {projection?.projectedDate && !projection.isReached
                  ? ` · estimé le ${format(projection.projectedDate, 'd MMM', { locale: fr })}`
                  : ''}
              </p>
              <Progress
                value={goalProgressPercent(goal)}
                className="mt-2 h-1.5 bg-muted"
              />
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
