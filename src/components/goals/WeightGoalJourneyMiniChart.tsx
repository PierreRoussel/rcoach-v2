import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { WeightEntry } from '@/lib/graphql/operations'
import {
  buildJourneyChartData,
  type JourneyChartPoint,
} from '@/lib/goals/weight-goal-celebration'
import { formatWeightKg, type WeightGoal } from '@/lib/goals/weight-goal'

type WeightGoalJourneyMiniChartProps = {
  goal: WeightGoal
  entries: WeightEntry[]
  className?: string
}

function buildYDomain(goal: WeightGoal, points: JourneyChartPoint[]): [number, number] {
  const weights = [
    goal.start_weight_kg,
    goal.current_weight_kg,
    goal.target_weight_kg,
    ...points.flatMap((point) => (point.weight != null ? [point.weight] : [])),
  ]

  return [Math.min(...weights) - 0.5, Math.max(...weights) + 0.5]
}

export function WeightGoalJourneyMiniChart({
  goal,
  entries,
  className,
}: WeightGoalJourneyMiniChartProps) {
  const chartData = useMemo(
    () => buildJourneyChartData(goal, entries),
    [goal, entries],
  )
  const yDomain = useMemo(() => buildYDomain(goal, chartData), [goal, chartData])
  const hasData = chartData.some((point) => point.weight != null)

  if (!hasData) {
    return (
      <p className="text-center text-sm text-[#4B5563]">
        Pas assez de pesées pour afficher la courbe.
      </p>
    )
  }

  return (
    <div className={className} style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(16,185,129,0.12)"
            vertical={false}
          />
          <XAxis
            dataKey="weekKey"
            tickLine={false}
            axisLine={{ stroke: 'rgba(16,185,129,0.2)' }}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickFormatter={(value: string) =>
              format(parseISO(value), 'd MMM', { locale: fr })
            }
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={yDomain}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#6B7280' }}
            width={32}
          />
          <Tooltip
            labelFormatter={(value) =>
              format(parseISO(String(value)), 'd MMMM yyyy', { locale: fr })
            }
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value) =>
              value != null ? [formatWeightKg(Number(value)), 'Poids'] : ['—', '']
            }
          />
          <ReferenceLine
            y={goal.target_weight_kg}
            stroke="#10B981"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#059669"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#059669' }}
            activeDot={{ r: 5 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
