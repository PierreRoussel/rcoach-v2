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
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { WaistEntry } from '@/lib/graphql/operations'
import { cn } from '@/lib/utils'

type WaistProgressChartProps = {
  entries: WaistEntry[]
  className?: string
}

type WeeklyChartRow = {
  weekKey: string
  weekLabel: string
  actual: number | null
  showMonthLabel: boolean
  monthLabel: string
}

const WEEK_OPTS = { weekStartsOn: 1 as const }
const VISIBLE_WEEKS = 9
const CHART_HEIGHT = 288
const Y_AXIS_WIDTH = 40
const CHART_MARGIN = { top: 12, right: 16, left: 4, bottom: 28 }
const MIN_WEEK_WIDTH = 32

function formatWaistCm(value: number) {
  return `${value.toFixed(1).replace('.', ',')} cm`
}

function buildWaistByWeek(entries: WaistEntry[]) {
  const buckets = new Map<string, number[]>()

  for (const entry of entries) {
    const weekKey = format(startOfWeek(parseISO(entry.logged_at), WEEK_OPTS), 'yyyy-MM-dd')
    const values = buckets.get(weekKey) ?? []
    values.push(Number(entry.waist_cm))
    buckets.set(weekKey, values)
  }

  const waistByWeek = new Map<string, number>()
  for (const [weekKey, values] of buckets) {
    const average = values.reduce((sum, value) => sum + value, 0) / values.length
    waistByWeek.set(weekKey, Math.round(average * 10) / 10)
  }

  return waistByWeek
}

function buildWeeklyRange(entries: WaistEntry[]) {
  const today = startOfDay(new Date())
  const currentWeek = startOfWeek(today, WEEK_OPTS)
  const halfWindow = Math.floor(VISIBLE_WEEKS / 2)

  let rangeStart = subWeeks(currentWeek, halfWindow)
  let rangeEnd = addWeeks(currentWeek, VISIBLE_WEEKS - halfWindow - 1)

  const dataDates = [
    ...entries.map((entry) => startOfDay(parseISO(entry.logged_at))),
    today,
  ]

  if (dataDates.length > 0) {
    rangeStart = minDate([
      rangeStart,
      startOfWeek(minDate(dataDates), WEEK_OPTS),
    ])
    rangeEnd = maxDate([
      rangeEnd,
      endOfWeek(maxDate(dataDates), WEEK_OPTS),
    ])
  }

  return eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, WEEK_OPTS)
}

function buildWeeklyChartData(
  weeks: Date[],
  waistByWeek: Map<string, number>,
): WeeklyChartRow[] {
  return weeks.map((weekStart, index) => {
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    const weekEnd = endOfWeek(weekStart, WEEK_OPTS)
    const previousWeek = index > 0 ? weeks[index - 1]! : null

    return {
      weekKey,
      weekLabel: `${format(weekStart, 'd MMM', { locale: fr })} – ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`,
      actual: waistByWeek.get(weekKey) ?? null,
      showMonthLabel:
        index === 0 ||
        (previousWeek != null &&
          format(weekStart, 'yyyy-MM') !== format(previousWeek, 'yyyy-MM')),
      monthLabel: format(weekStart, 'MMM', { locale: fr }),
    }
  })
}

function buildYDomain(entries: WaistEntry[]): [number, number] {
  const values = entries.map((entry) => Number(entry.waist_cm))
  return [Math.min(...values) - 1, Math.max(...values) + 1]
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

function WaistYAxis({ domain }: { domain: [number, number] }) {
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

export function WaistProgressChart({ entries, className }: WaistProgressChartProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [weekWidth, setWeekWidth] = useState(MIN_WEEK_WIDTH)

  const waistByWeek = useMemo(() => buildWaistByWeek(entries), [entries])
  const weeks = useMemo(() => buildWeeklyRange(entries), [entries])
  const chartData = useMemo(
    () => buildWeeklyChartData(weeks, waistByWeek),
    [weeks, waistByWeek],
  )
  const yDomain = useMemo(() => buildYDomain(entries), [entries])

  const plotWidth = Math.max(weeks.length * weekWidth, weekWidth * VISIBLE_WEEKS)

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

  if (waistByWeek.size === 0) {
    return (
      <p className="px-4 text-sm text-muted-foreground">
        Aucune mesure de tour de taille enregistrée pour le moment.
      </p>
    )
  }

  return (
    <div className={cn('flex w-full', className)}>
      <WaistYAxis domain={yDomain} />

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
              formatter={(value) => {
                if (value == null) {
                  return ['—', '']
                }
                return [formatWaistCm(Number(value)), 'Tour de taille (moy.)']
              }}
            />
            <Line
              type="linear"
              dataKey="actual"
              stroke="var(--chart-3)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--chart-3)' }}
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
