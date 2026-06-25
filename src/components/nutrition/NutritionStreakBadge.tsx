import { CalendarDays, Flame } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { cn } from '@/lib/utils'

type NutritionStreakBadgeProps = {
  streak: number
  onClick: () => void
  className?: string
}

export function NutritionStreakBadge({
  streak,
  onClick,
  className,
}: NutritionStreakBadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      <button
        type="button"
        onClick={onClick}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Série nutrition : ${streak} jour${streak > 1 ? 's' : ''}`}
      >
        <Pill tone="solid-primary" className="shrink-0 shadow-sm">
          <Flame className="size-3 fill-current" />
          {streak}
        </Pill>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full text-primary"
        onClick={onClick}
        aria-label="Ouvrir le calendrier nutrition"
      >
        <CalendarDays className="size-4" />
      </Button>
    </div>
  )
}
