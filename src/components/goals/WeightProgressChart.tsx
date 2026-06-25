import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  eachWeekOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
import { cn } from '@/lib/utils'

type WeightProgressChartProps = {
  entries: WeightEntry[]
  goal: WeightGoal
  projection: WeightGoalProjection | null
  className?: string
}

type WeeklyChartRow = {
  weekKey: string
  weekLabel: string
  actual: number | null
  projected: number | null
  showMonthLabel: boolean
  monthLabel: string
}

const WEEK_OPTS = { weekStartsOn: 1 as const }
const VISIBLE_WEEKS = 9
const CHART_HEIGHT = 288
const Y_AXIS_WIDTH = 40
const CHART_MARGIN_TOP = 8
const CHART_MARGIN_RIGHT = 56
const CHART_MARGIN_BOTTOM = 24
const MIN_WEEK_WIDTH = 28

function buildWeightByWeek(entries: WeightEntry[]) {
  const buckets = new Map<string, number[]>()

  for (const entry of entries) {
    const weekStart = startOfWeek(parseISO(entry.logged_at), WEEK_OPTS)
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    const weights = buckets.get(weekKey) ?? []
    weights.push(Number(entry.weight_kg))
    buckets.set(weekKey, weights)
  }

  const weightByWeek = new Map<string, number>()
  for (const [weekKey, weights] of buckets) {
    const average = weights.reduce((sum, value) => sum + value, 0) / weights.length
    weightByWeek.set(weekKey, Math.round(average * 10) / 10)
  }

  return weightByWeek
}

function buildWeeklyRange(
  entries: WeightEntry[],
  goal: WeightGoal,
  projection: WeightGoalProjection | null,
) {
  const dates: Date[] = [startOfDay(parseISO(goal.created_at))]

  for (const entry of entries) {
    dates.push(startOfDay(parseISO(entry.logged_at)))
  }

  if (projection?.projectedDate) {
    dates.push(startOfDay(projection.projectedDate))
  }

  dates.push(startOfDay(new Date()))

  const rangeStart = startOfWeek(startOfMonth(minDate(dates)), WEEK_OPTS)
  const rangeEnd = endOfWeek(endOfMonth(maxDate(dates)), WEEK_OPTS)

  return eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, WEEK_OPTS)
}

function applyProjectionToWeeklyRows(
  rows: WeeklyChartRow[],
  goal: WeightGoal,
  projection: WeightGoalProjection | null,
  lastEntryWeekKey: string,
  lastEntryWeight: number,
) {
  const projectedWeekStart = projection?.projectedDate
    ? startOfWeek(projection.projectedDate, WEEK_OPTS)
    : null
  const projectedWeekKey = projectedWeekStart
    ? format(projectedWeekStart, 'yyyy-MM-dd')
    : null

  const showProjection =
    projectedWeekKey != null &&
    !projection?.isReached &&
    (projection?.weeklyRateKg ?? 0) > 0

  if (!showProjection) {
    return rows
  }

  const lastIndex = rows.findIndex((row) => row.weekKey === lastEntryWeekKey)
  const projectedIndex = rows.findIndex((row) => row.weekKey === projectedWeekKey)

  if (lastIndex < 0 || projectedIndex < 0 || projectedIndex <= lastIndex) {
    return rows
  }

  return rows.map((row, index) => {
    if (index < lastIndex || index > projectedIndex) {
      return row
    }

    if (index === lastIndex) {
      return { ...row, projected: lastEntryWeight }
    }

    if (index === projectedIndex) {
      return { ...row, projected: goal.target_weight_kg }
    }

    const progress = (index - lastIndex) / (projectedIndex - lastIndex)
    const interpolated =
      lastEntryWeight + (goal.target_weight_kg - lastEntryWeight) * progress

    return {
      ...row,
      projected: Math.round(interpolated * 10) / 10,
    }
  })
}

function buildWeeklyChartData(
  weeks: Date[],
  weightByWeek: Map<string, number>,
  goal: WeightGoal,
  projection: WeightGoalProjection | null,
): WeeklyChartRow[] {
  const lastEntryWeekKey =
    weightByWeek.size > 0
      ? [...weightByWeek.keys()].sort().at(-1)!
      : format(startOfWeek(parseISO(goal.created_at), WEEK_OPTS), 'yyyy-MM-dd')

  const lastEntryWeight =
    weightByWeek.get(lastEntryWeekKey) ?? goal.current_weight_kg

  const rows = weeks.map((weekStart, index) => {
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    const weekEnd = endOfWeek(weekStart, WEEK_OPTS)
    const previousWeek = index > 0 ? weeks[index - 1]! : null

    return {
      weekKey,
      weekLabel: `${format(weekStart, 'd MMM', { locale: fr })} – ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`,
      actual: weightByWeek.get(weekKey) ?? null,
      projected: null,
      showMonthLabel:
        index === 0 ||
        (previousWeek != null &&
          format(weekStart, 'yyyy-MM') !== format(previousWeek, 'yyyy-MM')),
      monthLabel: format(weekStart, 'MMM', { locale: fr }),
    }
  })

  return applyProjectionToWeeklyRows(
    rows,
    goal,
    projection,
    lastEntryWeekKey,
    lastEntryWeight,
  )
}

function buildYDomain(
  entries: WeightEntry[],
  goal: WeightGoal,
): [number, number] {
  const weights = [
    ...entries.map((entry) => Number(entry.weight_kg)),
    goal.target_weight_kg,
    goal.current_weight_kg,
    goal.start_weight_kg,
  ]

  const minWeight = Math.min(...weights) - 1
  const maxWeight = Math.max(...weights) + 1
  return [minWeight, maxWeight]
}

function buildYAxisTicks(min: number, max: number, count = 4) {
  if (count <= 1 || min === max) {
    return [min]
  }

  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, index) =>
    Math.round((min + step * index) * 10) / 10,
  )
}

function formatYAxisTick(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function WeightYAxis({ domain }: { domain: [number, number] }) {
  const [min, max] = domain
  const ticks = buildYAxisTicks(min, max)
  const plotHeight = CHART_HEIGHT - CHART_MARGIN_TOP - CHART_MARGIN_BOTTOM

  return (
    <div
      className="relative shrink-0 pl-3"
      style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}
      aria-hidden
    >
      {ticks.map((tick) => {
        const ratio = ticks.length === 1 ? 0 : (tick - min) / (max - min)
        const top = CHART_MARGIN_TOP + plotHeight - ratio * plotHeight

        return (
          <span
            key={tick}
            className="absolute right-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-muted-foreground"
            style={{ top }}
          >
            {formatYAxisTick(tick)}
          </span>
        )
      })}
    </div>
  )
}

function MonthTick({
  x,
  y,
  payload,
  chartData,
}: {
  x?: number
  y?: number
  payload?: { value?: string }
  chartData: WeeklyChartRow[]
}) {
  if (x == null || y == null || !payload?.value) {
    return null
  }

  const row = chartData.find((item) => item.weekKey === payload.value)
  if (!row?.showMonthLabel) {
    return null
  }

  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fill="var(--muted-foreground)"
      fontSize={11}
    >
      {row.monthLabel}
    </text>
  )
}

export function WeightProgressChart({
  entries,
  goal,
  projection,
  className,
}: WeightProgressChartProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [weekWidth, setWeekWidth] = useState(MIN_WEEK_WIDTH)

  const weightByWeek = useMemo(() => buildWeightByWeek(entries), [entries])
  const weeks = useMemo(
    () => buildWeeklyRange(entries, goal, projection),
    [entries, goal, projection],
  )
  const chartData = useMemo(
    () => buildWeeklyChartData(weeks, weightByWeek, goal, projection),
    [weeks, weightByWeek, goal, projection],
  )
  const yDomain = useMemo(() => buildYDomain(entries, goal), [entries, goal])

  const plotWidth = Math.max(
    weeks.length * weekWidth,
    weekWidth * VISIBLE_WEEKS,
  )

  useEffect(() => {
    const node = viewportRef.current
    if (!node) {
      return
    }

    const updateWeekWidth = () => {
      const nextWidth = node.clientWidth / VISIBLE_WEEKS
      setWeekWidth(
        Number.isFinite(nextWidth) && nextWidth > 0 ? nextWidth : MIN_WEEK_WIDTH,
      )
    }

    updateWeekWidth()
    const observer = new ResizeObserver(updateWeekWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const node = viewportRef.current
    if (!node || plotWidth <= 0) {
      return
    }

    node.scrollLeft = getScrollLeftForCurrentWeekCentered(node, weeks, plotWidth)
  }, [plotWidth, weeks, weekWidth])

  if (weightByWeek.size === 0) {
    return (
      <p className="px-4 text-sm text-muted-foreground">
        Aucune pesée enregistrée pour le moment.
      </p>
    )
  }

  return (
    <div className={cn('flex w-full overflow-hidden', className)}>
      <WeightYAxis domain={yDomain} />

      <div
        ref={viewportRef}
        className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:thin]"
      >
        <div style={{ width: plotWidth, height: CHART_HEIGHT }}>
          <LineChart
            width={plotWidth}
            height={CHART_HEIGHT}
            data={chartData}
            margin={{
              top: CHART_MARGIN_TOP,
              right: CHART_MARGIN_RIGHT,
              left: 0,
              bottom: CHART_MARGIN_BOTTOM,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(107,95,166,0.12)"
              vertical
            />
            <XAxis
              dataKey="weekKey"
              interval={0}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={(props) => <MonthTick {...props} chartData={chartData} />}
              height={32}
            />
            <YAxis hide domain={yDomain} width={0} />
            <Tooltip
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as WeeklyChartRow | undefined
                return row?.weekLabel ?? ''
              }}
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
                  `${formatWeightKg(Number(value))}${name === 'actual' ? ' (moy.)' : ''}`,
                  name === 'projected' ? 'Projection' : 'Poids',
                ]
              }}
            />
            <ReferenceLine
              y={goal.target_weight_kg}
              stroke="var(--chart-2)"
              strokeDasharray="6 4"
              strokeWidth={2}
              ifOverflow="extendDomain"
              label={{
                value: `Cible ${formatWeightKg(goal.target_weight_kg)}`,
                position: 'insideTopRight',
                fill: 'var(--chart-2)',
                fontSize: 11,
                fontWeight: 600,
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
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: 'var(--chart-2)' }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </div>
      </div>
    </div>
  )
}

function getScrollLeftForCurrentWeekCentered(
  viewport: HTMLDivElement,
  weeks: Date[],
  plotWidth: number,
) {
  const currentWeekKey = format(startOfWeek(new Date(), WEEK_OPTS), 'yyyy-MM-dd')
  const currentIndex = weeks.findIndex(
    (week) => format(week, 'yyyy-MM-dd') === currentWeekKey,
  )

  const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth)

  if (currentIndex < 0 || weeks.length === 0) {
    return maxScroll
  }

  const weekStep = plotWidth / weeks.length
  const weekCenter = (currentIndex + 0.5) * weekStep
  const viewportCenter = viewport.clientWidth / 2

  return Math.min(maxScroll, Math.max(0, weekCenter - viewportCenter))
}
