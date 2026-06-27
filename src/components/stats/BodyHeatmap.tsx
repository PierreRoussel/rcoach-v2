import { useCallback, useLayoutEffect, useRef } from 'react'

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

  const handleSvgRef = useCallback(
    (node: SVGSVGElement | null) => {
      fullSvgRef.current = node
      if (node) {
        applyHumanBodyIntensities(node, intensities)
      }
    },
    [intensities],
  )

  useLayoutEffect(() => {
    if (fullSvgRef.current) {
      applyHumanBodyIntensities(fullSvgRef.current, intensities)
    }
  }, [intensities, showSideLabels])

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
          <div
            className={cn(
              'human-body-labeled-frame',
              compact && 'human-body-labeled-frame--compact',
            )}
          >
            <div className="human-body-labeled-frame__content">
              <div className="human-body-labeled-frame__labels">
                <span className={sideLabelClassName}>Face</span>
                <span className={sideLabelClassName}>Dos</span>
              </div>
              <div className="human-body-labeled-frame__figure">
                <HumanBodySvg
                  svgRef={handleSvgRef}
                  side="both"
                  className="human-body-svg--labeled"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={panelClassName}>
          <HumanBodySvg svgRef={handleSvgRef} />
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
