import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import type { RadarMusclePoint } from '@/lib/stats/analytics'

type MuscleRadarChartProps = {
  data: RadarMusclePoint[]
}

export function MuscleRadarChart({ data }: MuscleRadarChartProps) {
  if (data.every((point) => point.value === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        Pas assez de donnees pour le graphique radar.
      </p>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(107,95,166,0.18)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value) => [`${value ?? 0}%`, 'Frequence relative']}
          />
          <Radar
            name="Zones"
            dataKey="value"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
