import { cn } from '@/lib/utils'

type BodyHeatmapProps = {
  intensities: Record<string, number>
  className?: string
}

function regionFill(intensity: number) {
  const clamped = Math.min(1, Math.max(0, intensity))
  const alpha = 0.12 + clamped * 0.78
  return `color-mix(in srgb, var(--primary) ${Math.round(alpha * 100)}%, var(--muted))`
}

function BodyRegion({
  d,
  intensity,
  label,
}: {
  d: string
  intensity: number
  label: string
}) {
  return (
    <path
      d={d}
      fill={regionFill(intensity)}
      stroke="var(--border)"
      strokeWidth={1.2}
      aria-label={label}
    >
      <title>{`${label} · ${Math.round(intensity * 100)}% d intensite relative`}</title>
    </path>
  )
}

export function BodyHeatmap({ intensities, className }: BodyHeatmapProps) {
  const i = (key: string) => intensities[key] ?? 0

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="space-y-2">
        <p className="text-center text-xs font-semibold text-muted-foreground">Face</p>
        <svg viewBox="0 0 120 220" className="mx-auto h-56 w-full max-w-[140px]">
          <ellipse cx="60" cy="24" rx="16" ry="18" fill="var(--muted)" stroke="var(--border)" />
          <BodyRegion
            label="Epaules"
            intensity={i('shoulders')}
            d="M28 44 C38 38, 82 38, 92 44 L88 58 C70 52, 50 52, 32 58 Z"
          />
          <BodyRegion
            label="Pectoraux"
            intensity={i('chest')}
            d="M36 58 C48 54, 72 54, 84 58 L80 92 C62 98, 58 98, 40 92 Z"
          />
          <BodyRegion
            label="Biceps"
            intensity={i('biceps')}
            d="M18 58 C26 62, 30 108, 28 132 C22 128, 16 90, 18 58 Z M102 58 C94 62, 90 108, 92 132 C98 128, 104 90, 102 58 Z"
          />
          <BodyRegion
            label="Abdos"
            intensity={i('abs')}
            d="M42 94 C58 90, 62 90, 78 94 L74 128 C58 134, 54 134, 38 128 Z"
          />
          <BodyRegion
            label="Jambes"
            intensity={i('legs')}
            d="M38 132 C48 128, 72 128, 82 132 L78 188 C68 196, 52 196, 42 188 Z"
          />
          <BodyRegion
            label="Mollets"
            intensity={i('calves')}
            d="M44 188 C52 184, 68 184, 76 188 L72 210 C60 214, 52 214, 44 210 Z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <p className="text-center text-xs font-semibold text-muted-foreground">Dos</p>
        <svg viewBox="0 0 120 220" className="mx-auto h-56 w-full max-w-[140px]">
          <ellipse cx="60" cy="24" rx="16" ry="18" fill="var(--muted)" stroke="var(--border)" />
          <BodyRegion
            label="Epaules"
            intensity={i('shoulders')}
            d="M28 44 C38 38, 82 38, 92 44 L88 58 C70 52, 50 52, 32 58 Z"
          />
          <BodyRegion
            label="Dos"
            intensity={i('back')}
            d="M34 58 C48 54, 72 54, 86 58 L82 126 C62 132, 58 132, 38 126 Z"
          />
          <BodyRegion
            label="Triceps"
            intensity={i('triceps')}
            d="M18 58 C26 62, 30 108, 28 132 C22 128, 16 90, 18 58 Z M102 58 C94 62, 90 108, 92 132 C98 128, 104 90, 102 58 Z"
          />
          <BodyRegion
            label="Fessiers"
            intensity={i('glutes')}
            d="M36 126 C50 120, 70 120, 84 126 L80 148 C62 154, 58 154, 40 148 Z"
          />
          <BodyRegion
            label="Jambes"
            intensity={i('legs')}
            d="M38 148 C48 144, 72 144, 82 148 L78 188 C68 196, 52 196, 42 188 Z"
          />
          <BodyRegion
            label="Mollets"
            intensity={i('calves')}
            d="M44 188 C52 184, 68 184, 76 188 L72 210 C60 214, 52 214, 44 210 Z"
          />
        </svg>
      </div>

      <div className="col-span-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block size-3 rounded-full bg-muted" />
        <span>Peu travaille</span>
        <span
          className="inline-block size-3 rounded-full"
          style={{ background: regionFill(1) }}
        />
        <span>Plus travaille</span>
      </div>
    </div>
  )
}
