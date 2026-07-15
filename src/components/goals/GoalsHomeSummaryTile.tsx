import { TrendingDown, TrendingUp, Target } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { WeightMaintainDriftGauge } from '@/components/goals/WeightMaintainDriftGauge'
import { GoalProjectionPremiumBlur } from '@/components/goals/GoalProjectionPremiumBlur'
import {
  HomeSummaryMetric,
  HomeSummaryMetricDivider,
  HomeSummaryMetricsRow,
  HomeSummaryProgress,
  HomeSummaryTile,
  HomeSummaryTileFooter,
  HomeSummaryTileSkeleton,
} from '@/design-system'
import { useNutritionSettings } from '@/hooks/useNutritionSettings'
import { useEntitlement } from '@/hooks/useSubscription'
import { useUserMeasurements } from '@/hooks/useUserMeasurements'
import { useWeightEntries } from '@/hooks/useWeightEntries'
import { useWeightGoalProjectionBackfill } from '@/hooks/useWeightGoalProjectionBackfill'
import { useResolvedWeightGoal } from '@/hooks/useWeightGoal'
import {
  formatMaintainGoalStatusLabel,
  goalProgressPercent,
  resolveStableProjection,
  WEIGHT_GOAL_TYPE_LABELS,
} from '@/lib/goals/weight-goal'
import { getLatestWeightLoggedAt } from '@/lib/measurements/current-weight'

function formatWeightNumber(value: number) {
  return value.toFixed(1).replace('.', ',')
}

export function GoalsHomeSummaryTile() {
  const { data: goal, isLoading: goalLoading } = useResolvedWeightGoal()
  const { data: nutritionSettings } = useNutritionSettings()
  const { data: userMeasurements } = useUserMeasurements()
  const { data: weightEntries = [] } = useWeightEntries()
  const { entitled: hasGoalProjection } = useEntitlement('goal_projection')
  useWeightGoalProjectionBackfill()

  const projection =
    goal && nutritionSettings
      ? resolveStableProjection(
          goal,
          nutritionSettings,
          userMeasurements,
          getLatestWeightLoggedAt(weightEntries),
        )
      : null

  const estimationLabel =
    goal &&
    goal.goal_type !== 'maintain' &&
    projection?.projectedDate &&
    !projection.isReached
      ? [
          `visé le ${format(projection.projectedDate, 'd MMMM', { locale: fr })}`,
          projection.paceStatus?.status === 'stale'
            ? null
            : projection.paceStatus?.message.toLowerCase(),
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  return (
    <HomeSummaryTile
      to="/app/goals"
      ariaLabel="Ouvrir la page objectifs"
      icon={Target}
      title="Objectif poids"
      className="border-0 bg-gradient-to-br from-soft-purple via-card to-soft-purple/50 shadow-sm active:scale-[0.99]"
      iconClassName="bg-soft-purple text-soft-purple-fg"
    >
      {goalLoading ? (
        <HomeSummaryTileSkeleton />
      ) : !goal ? (
        <p className="text-sm text-foreground/70">
          Définissez votre objectif poids pour suivre votre progression.
        </p>
      ) : goal.goal_type === 'maintain' ? (
        <>
          <HomeSummaryMetricsRow>
            <HomeSummaryMetric
              value={formatWeightNumber(goal.current_weight_kg)}
              label="kg actuel"
            />
            <HomeSummaryMetric
              value={formatWeightNumber(goal.target_weight_kg)}
              label="kg cible"
              tone="purple"
              className="text-right"
            />
          </HomeSummaryMetricsRow>
          <HomeSummaryTileFooter left={formatMaintainGoalStatusLabel(goal)} />
          <WeightMaintainDriftGauge goal={goal} compact className="mt-3" />
        </>
      ) : (
        <>
          <HomeSummaryMetricsRow>
            <HomeSummaryMetric
              value={formatWeightNumber(goal.current_weight_kg)}
              label="kg actuel"
            />
            <HomeSummaryMetricDivider>
              {goal.goal_type === 'lose' ? (
                <TrendingDown className="size-5" strokeWidth={2.25} />
              ) : (
                <TrendingUp className="size-5" strokeWidth={2.25} />
              )}
            </HomeSummaryMetricDivider>
            <HomeSummaryMetric
              value={formatWeightNumber(goal.target_weight_kg)}
              label="kg cible"
              tone="purple"
              className="text-right"
            />
          </HomeSummaryMetricsRow>

          <HomeSummaryProgress
            value={goalProgressPercent(goal)}
            className="[&_[data-slot=progress-indicator]]:bg-[#9b87d4] dark:[&_[data-slot=progress-indicator]]:bg-purple-400"
          />

          <HomeSummaryTileFooter
            left={WEIGHT_GOAL_TYPE_LABELS[goal.goal_type]}
            rightClassName="text-soft-purple-fg"
            right={
              estimationLabel ? (
                <GoalProjectionPremiumBlur entitled={hasGoalProjection} variant="inline">
                  {estimationLabel}
                </GoalProjectionPremiumBlur>
              ) : null
            }
          />
        </>
      )}
    </HomeSummaryTile>
  )
}
