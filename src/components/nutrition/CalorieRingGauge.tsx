import { cn } from '@/lib/utils'

type CalorieRingGaugeProps = {
  consumed: number
  target: number
  className?: string
}

export function CalorieRingGauge({ consumed, target, className }: CalorieRingGaugeProps) {
  const remaining = Math.max(0, target - consumed)
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <div className={cn('relative mx-auto flex size-40 items-center justify-center', className)}>
      <svg className="size-full -rotate-90" viewBox="0 0 128 128" aria-hidden>
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/40"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display text-3xl font-black text-foreground">{remaining}</div>
        <div className="text-sm font-semibold text-muted-foreground">Restantes</div>
      </div>
    </div>
  )
}
