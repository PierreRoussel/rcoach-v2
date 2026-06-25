import { Flame } from 'lucide-react'

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
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', className)}
      aria-label={`Serie nutrition : ${streak} jour${streak > 1 ? 's' : ''}`}
    >
      <Pill tone="solid-primary" className="shrink-0 shadow-sm">
        <Flame className="size-3 fill-current" />
        {streak}
      </Pill>
    </button>
  )
}
