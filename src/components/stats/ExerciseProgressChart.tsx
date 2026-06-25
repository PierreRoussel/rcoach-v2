import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ExerciseTimelinePoint } from '@/lib/stats/exercise-progression'

type ExerciseProgressChartProps = {
  timeline: ExerciseTimelinePoint[]
}

export function ExerciseProgressChart({ timeline }: ExerciseProgressChartProps) {
  const chartData = timeline
    .filter((point) => point.best1Rm != null)
    .map((point) => ({
      date: format(parseISO(point.date), 'd MMM', { locale: fr }),
      best1Rm: Math.round(point.best1Rm ?? 0),
      volume: Math.round(point.sessionVolume),
      label: point.topSetLabel,
    }))

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pas assez de données pour afficher la progression sur cette période.
      </p>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,95,166,0.12)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value, name, item) => {
              if (name === 'best1Rm') {
                const payload = item.payload as { label?: string }
                return [
                  `${value} kg est.`,
                  payload.label ? ` (${payload.label})` : '',
                ]
              }

              return [value, name]
            }}
          />
          <Line
            type="monotone"
            dataKey="best1Rm"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--chart-1)' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
