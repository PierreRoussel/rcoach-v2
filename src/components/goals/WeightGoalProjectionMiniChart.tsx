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

import type { ProjectionChartPoint } from '@/lib/goals/weight-goal-setup-celebration'
import { formatWeightKg, type WeightGoal } from '@/lib/goals/weight-goal'
import { cn } from '@/lib/utils'

type WeightGoalProjectionMiniChartProps = {
  goal: Pick<WeightGoal, 'current_weight_kg' | 'target_weight_kg'>
  points: ProjectionChartPoint[]
  goalType: 'lose' | 'gain'
  className?: string
}

function buildYDomain(
  goal: Pick<WeightGoal, 'current_weight_kg' | 'target_weight_kg'>,
  points: ProjectionChartPoint[],
): [number, number] {
  const weights = [
    goal.current_weight_kg,
    goal.target_weight_kg,
    ...points.map((point) => point.weight),
  ]

  return [Math.min(...weights) - 0.5, Math.max(...weights) + 0.5]
}

const CHART_THEME = {
  lose: {
    grid: 'rgba(59,130,246,0.12)',
    axis: 'rgba(59,130,246,0.2)',
    line: '#2563EB',
    target: '#3B82F6',
    border: 'rgba(59,130,246,0.25)',
  },
  gain: {
    grid: 'rgba(245,158,11,0.12)',
    axis: 'rgba(245,158,11,0.2)',
    line: '#D97706',
    target: '#F59E0B',
    border: 'rgba(245,158,11,0.25)',
  },
} as const

export function WeightGoalProjectionMiniChart({
  goal,
  points,
  goalType,
  className,
}: WeightGoalProjectionMiniChartProps) {
  const theme = CHART_THEME[goalType]
  const yDomain = useMemo(() => buildYDomain(goal, points), [goal, points])

  if (points.length === 0) {
    return (
      <p className="text-center text-sm text-[#4B5563]">
        Ajustez vos calories pour estimer une date.
      </p>
    )
  }

  return (
    <div className={cn(className)} style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.grid}
            vertical={false}
          />
          <XAxis
            dataKey="weekKey"
            tickLine={false}
            axisLine={{ stroke: theme.axis }}
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
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value) =>
              value != null ? [formatWeightKg(Number(value)), 'Poids'] : ['—', '']
            }
          />
          <ReferenceLine
            y={goal.target_weight_kg}
            stroke={theme.target}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={theme.line}
            strokeWidth={2.5}
            dot={{ r: 3, fill: theme.line }}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
