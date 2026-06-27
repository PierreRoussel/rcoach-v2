import { useEffect, useRef } from 'react'

import { HumanBodySvg } from '@/components/stats/human-body/HumanBodySvg'
import {
  applyHumanBodyIntensities,
  regionFill,
} from '@/components/stats/human-body/muscle-region-map'
import '@/components/stats/human-body/human-body.css'
import { cn } from '@/lib/utils'

type HumanBodyHeatmapProps = {
  intensities: Record<string, number>
  className?: string
  compact?: boolean
  showLegend?: boolean
  showSideLabels?: boolean
  legendVariant?: 'stats' | 'exercise'
}

export function HumanBodyHeatmap({
  intensities,
  className,
  compact = false,
  showLegend = true,
  showSideLabels = true,
  legendVariant = 'stats',
}: HumanBodyHeatmapProps) {
  const fullSvgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (fullSvgRef.current) {
      applyHumanBodyIntensities(fullSvgRef.current, intensities)
    }
  }, [intensities])

  const panelClassName = cn(
    'rounded-3xl border border-border/70 bg-gradient-to-b from-muted/25 to-muted/10 shadow-sm',
    compact ? 'p-2' : 'p-3 sm:p-4',
  )

  const sideLabelClassName =
    'text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase'

  return (
    <div
      className={cn(
        'human-body-heatmap',
        compact && 'human-body-heatmap--compact',
        className,
      )}
    >
      {showSideLabels ? (
        <div className={panelClassName}>
          <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4">
            <span className={sideLabelClassName}>Face</span>
            <span className={sideLabelClassName}>Dos</span>
          </div>
          <HumanBodySvg svgRef={fullSvgRef} side="both" className="mt-2 w-full" />
        </div>
      ) : (
        <div className={panelClassName}>
          <HumanBodySvg svgRef={fullSvgRef} />
        </div>
      )}

      {showLegend ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-full bg-muted ring-1 ring-border/60" />
            {legendVariant === 'stats' ? 'Peu travaille' : 'Peu sollicité'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-3 rounded-full ring-1 ring-border/60"
              style={{ background: regionFill(1) }}
            />
            {legendVariant === 'stats' ? 'Plus travaille' : 'Zone ciblée'}
          </span>
        </div>
      ) : null}
    </div>
  )
}

type BodyHeatmapProps = {
  intensities: Record<string, number>
  className?: string
}

export function BodyHeatmap({ intensities, className }: BodyHeatmapProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <HumanBodyHeatmap intensities={intensities} />
    </div>
  )
}
