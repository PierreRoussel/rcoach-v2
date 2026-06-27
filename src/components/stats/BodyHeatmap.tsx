import { useEffect, useRef } from 'react'

import { HumanBodySvg } from '@/components/stats/human-body/HumanBodySvg'
import {
  applyHumanBodyIntensities,
  regionFill,
} from '@/components/stats/human-body/muscle-region-map'
import '@/components/stats/human-body/human-body.css'
import { cn } from '@/lib/utils'

type BodyHeatmapProps = {
  intensities: Record<string, number>
  className?: string
}

export function BodyHeatmap({ intensities, className }: BodyHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) {
      return
    }

    applyHumanBodyIntensities(svgRef.current, intensities)
  }, [intensities])

  return (
    <div className={cn('human-body-heatmap space-y-4', className)}>
      <div className="grid grid-cols-2 gap-2 px-1 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <span>Face</span>
        <span>Dos</span>
      </div>

      <div className="rounded-3xl border border-border/70 bg-gradient-to-b from-muted/25 to-muted/10 p-3 shadow-sm sm:p-4">
        <HumanBodySvg svgRef={svgRef} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full bg-muted ring-1 ring-border/60" />
          Peu travaille
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-full ring-1 ring-border/60"
            style={{ background: regionFill(1) }}
          />
          Plus travaille
        </span>
      </div>
    </div>
  )
}
