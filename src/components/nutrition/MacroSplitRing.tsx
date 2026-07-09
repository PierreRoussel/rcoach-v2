import {
  buildMacroArcSegments,
  MACRO_CHART_COLORS,
  type MacroGrams,
} from '@/lib/nutrition/macro-visuals'
import { cn } from '@/lib/utils'

type MacroSplitRingProps = {
  progress: number
  macros?: MacroGrams
  radius: number
  strokeWidth: number
  size: number
  isOverTarget?: boolean
  className?: string
}

export function MacroSplitRing({
  progress,
  macros,
  radius,
  strokeWidth,
  size,
  isOverTarget = false,
  className,
}: MacroSplitRingProps) {
  const circumference = 2 * Math.PI * radius
  const filledLength = circumference * Math.min(Math.max(progress, 0), 1)
  const macroSegments =
    macros && !isOverTarget ? buildMacroArcSegments(macros, filledLength) : []
  const useMacroSegments = macroSegments.some((segment) => segment.length > 0)
  let segmentOffset = 0
  const center = size / 2

  return (
    <svg
      className={cn('pointer-events-none -rotate-90', className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/35"
      />
      {isOverTarget ? (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--nutrient-warning-fg)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      ) : useMacroSegments ? (
        macroSegments.map((segment) => {
          const dasharray = `${segment.length} ${circumference - segment.length}`
          const dashoffset = -segmentOffset
          segmentOffset += segment.length

          return (
            <circle
              key={segment.macro}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={MACRO_CHART_COLORS[segment.macro]}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              className="transition-[stroke-dashoffset] duration-500"
            />
          )
        })
      ) : (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      )}
    </svg>
  )
}
