import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  addWeeks,
  eachWeekOfInterval,
  endOfWeek,
  format,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { WeightEntry } from '@/lib/graphql/operations'
import {
  formatWeightKg,
  resolveGoalChartProjection,
  type GoalChartProjection,
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
const CHART_MARGIN = { top: 12, right: 56, left: 4, bottom: 28 }
const MIN_WEEK_WIDTH = 32

function buildWeightByWeek(entries: WeightEntry[]) {
  const buckets = new Map<string, number[]>()

  for (const entry of entries) {
    const weekKey = format(startOfWeek(parseISO(entry.logged_at), WEEK_OPTS), 'yyyy-MM-dd')
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
  chartProjection: GoalChartProjection | null,
) {
  const today = startOfDay(new Date())
  const currentWeek = startOfWeek(today, WEEK_OPTS)
  const halfWindow = Math.floor(VISIBLE_WEEKS / 2)

  let rangeStart = subWeeks(currentWeek, halfWindow)
  let rangeEnd = addWeeks(currentWeek, VISIBLE_WEEKS - halfWindow - 1)

  const dataDates = [
    startOfDay(parseISO(goal.created_at)),
    ...entries.map((entry) => startOfDay(parseISO(entry.logged_at))),
    today,
  ]

  if (chartProjection?.projectedDate) {
    dataDates.push(startOfDay(chartProjection.projectedDate))
  }

  rangeStart = minDate([
    rangeStart,
    startOfWeek(minDate(dataDates), WEEK_OPTS),
  ])
  rangeEnd = maxDate([
    rangeEnd,
    endOfWeek(maxDate(dataDates), WEEK_OPTS),
  ])

  if (chartProjection?.projectedDate) {
    const projectedWeekEnd = endOfWeek(chartProjection.projectedDate, WEEK_OPTS)
    if (projectedWeekEnd > rangeEnd) {
      rangeEnd = projectedWeekEnd
    }
  }

  return eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, WEEK_OPTS)
}

function applyProjectionCurve(
  rows: WeeklyChartRow[],
  goal: WeightGoal,
  chartProjection: GoalChartProjection | null,
) {
  if (!chartProjection) {
    return rows
  }

  const startWeekKey = format(startOfWeek(new Date(), WEEK_OPTS), 'yyyy-MM-dd')
  const endWeekKey = format(
    startOfWeek(chartProjection.projectedDate, WEEK_OPTS),
    'yyyy-MM-dd',
  )

  let startIndex = rows.findIndex((row) => row.weekKey === startWeekKey)
  let endIndex = rows.findIndex((row) => row.weekKey === endWeekKey)

  if (startIndex < 0) {
    startIndex = rows.length - 1
  }

  if (endIndex < 0) {
    endIndex = rows.length - 1
  }

  if (endIndex <= startIndex) {
    endIndex = Math.min(rows.length - 1, startIndex + 1)
  }

  const startWeight = goal.current_weight_kg
  const endWeight = goal.target_weight_kg

  return rows.map((row, index) => {
    if (index < startIndex || index > endIndex) {
      return row
    }

    const progress = (index - startIndex) / (endIndex - startIndex)
    const projected =
      Math.round((startWeight + (endWeight - startWeight) * progress) * 10) / 10

    return { ...row, projected }
  })
}

function buildWeeklyChartData(
  weeks: Date[],
  weightByWeek: Map<string, number>,
  goal: WeightGoal,
  chartProjection: GoalChartProjection | null,
): WeeklyChartRow[] {
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

  return applyProjectionCurve(rows, goal, chartProjection)
}

function buildYDomain(entries: WeightEntry[], goal: WeightGoal): [number, number] {
  const weights = [
    ...entries.map((entry) => Number(entry.weight_kg)),
    goal.target_weight_kg,
    goal.current_weight_kg,
    goal.start_weight_kg,
  ]

  return [Math.min(...weights) - 1, Math.max(...weights) + 1]
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

function WeightYAxis({ domain }: { domain: [number, number] }) {
  const [min, max] = domain
  const ticks = buildYAxisTicks(min, max)
  const plotHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom

  return (
    <div
      className="relative shrink-0 pl-3"
      style={{ width: Y_AXIS_WIDTH, height: CHART_HEIGHT }}
      aria-hidden
    >
      {ticks.map((tick) => {
        const ratio = ticks.length === 1 ? 0 : (tick - min) / (max - min)
        const top = CHART_MARGIN.top + plotHeight - ratio * plotHeight

        return (
          <span
            key={tick}
            className="absolute right-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-muted-foreground"
            style={{ top }}
          >
            {Number.isInteger(tick) ? String(tick) : tick.toFixed(1)}
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

  const chartProjection = useMemo(
    () => resolveGoalChartProjection(goal, projection),
    [goal, projection],
  )
  const weightByWeek = useMemo(() => buildWeightByWeek(entries), [entries])
  const weeks = useMemo(
    () => buildWeeklyRange(entries, goal, chartProjection),
    [entries, goal, chartProjection],
  )
  const chartData = useMemo(
    () => buildWeeklyChartData(weeks, weightByWeek, goal, chartProjection),
    [weeks, weightByWeek, goal, chartProjection],
  )
  const yDomain = useMemo(() => buildYDomain(entries, goal), [entries, goal])

  const plotWidth = Math.max(weeks.length * weekWidth, weekWidth * VISIBLE_WEEKS)
  const hasProjection = chartData.some((row) => row.projected != null)

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
    <div className={cn('flex w-full', className)}>
      <WeightYAxis domain={yDomain} />

      <div
        ref={viewportRef}
        className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:thin]"
      >
        <div style={{ width: plotWidth, height: CHART_HEIGHT }}>
          <ComposedChart
            width={plotWidth}
            height={CHART_HEIGHT}
            data={chartData}
            margin={CHART_MARGIN}
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
              height={36}
            />
            <YAxis domain={yDomain} hide width={0} />
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
                value: `Objectif ${formatWeightKg(goal.target_weight_kg)}`,
                position: 'insideTopRight',
                fill: 'var(--chart-2)',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            {hasProjection ? (
              <Line
                type="linear"
                dataKey="projected"
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={{ r: 3, fill: 'var(--chart-2)' }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            <Line
              type="linear"
              dataKey="actual"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--chart-1)' }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
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
    return Math.max(0, maxScroll / 2)
  }

  const weekStep = plotWidth / weeks.length
  const weekCenter = (currentIndex + 0.5) * weekStep

  return Math.min(maxScroll, Math.max(0, weekCenter - viewport.clientWidth / 2))
}
