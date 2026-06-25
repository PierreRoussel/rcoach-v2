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
  formatWeightKg,
  type WeightGoal,
  type WeightGoalProjection,
} from '@/lib/goals/weight-goal'

type WeightProgressChartProps = {
  entries: WeightEntry[]
  goal: WeightGoal
  projection: WeightGoalProjection | null
}

type ChartRow = {
  dateLabel: string
  actual: number | null
  projected: number | null
}

export function WeightProgressChart({
  entries,
  goal,
  projection,
}: WeightProgressChartProps) {
  const mergedData: ChartRow[] = entries.map((entry) => ({
    dateLabel: format(parseISO(entry.logged_at), 'd MMM', { locale: fr }),
    actual: Number(entry.weight_kg),
    projected: null,
  }))

  if (
    projection?.projectedDate &&
    !projection.isReached &&
    projection.weeklyRateKg > 0 &&
    mergedData.length > 0
  ) {
    const last = mergedData[mergedData.length - 1]!
    mergedData.push({
      dateLabel: last.dateLabel,
      actual: null,
      projected: last.actual,
    })
    mergedData.push({
      dateLabel: format(projection.projectedDate, 'd MMM yyyy', { locale: fr }),
      actual: null,
      projected: goal.target_weight_kg,
    })
  }

  if (mergedData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune pesée enregistrée pour le moment.
      </p>
    )
  }

  const allWeights = [
    ...entries.map((entry) => Number(entry.weight_kg)),
    goal.target_weight_kg,
  ]
  const minWeight = Math.min(...allWeights) - 1
  const maxWeight = Math.max(...allWeights) + 1

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,166,0.12)" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            domain={[minWeight, maxWeight]}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={(value) => `${value} kg`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              if (value == null) {
                return ['—', '']
              }
              return [
                formatWeightKg(Number(value)),
                name === 'projected' ? 'Projection' : 'Poids',
              ]
            }}
          />
          <ReferenceLine
            y={goal.target_weight_kg}
            stroke="var(--chart-2)"
            strokeDasharray="6 4"
            label={{
              value: `Cible ${formatWeightKg(goal.target_weight_kg)}`,
              position: 'insideTopRight',
              fill: 'var(--muted-foreground)',
              fontSize: 11,
            }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--chart-1)' }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="var(--chart-2)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: 'var(--chart-2)' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
