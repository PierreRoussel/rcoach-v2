import { useEffect, useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'

import { NutritionStreakPill } from '@/components/nutrition/NutritionStreakPill'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NutritionStreakBadgeProps = {
  streak: number
  onStreakClick: () => void
  onCalendarClick: () => void
  className?: string
  isFrozen?: boolean
  validatedToday?: boolean
}

export function NutritionStreakBadge({
  streak,
  onStreakClick,
  onCalendarClick,
  className,
  isFrozen = false,
  validatedToday = false,
}: NutritionStreakBadgeProps) {
  const previousStreakRef = useRef(streak)
  const [bump, setBump] = useState(false)

  useEffect(() => {
    if (streak > previousStreakRef.current) {
      setBump(true)
      const timer = window.setTimeout(() => setBump(false), 600)
      previousStreakRef.current = streak
      return () => window.clearTimeout(timer)
    }

    previousStreakRef.current = streak
  }, [streak])

  const streakLabel = isFrozen
    ? `Série gelée : ${streak} jour${streak > 1 ? 's' : ''}`
    : `Série nutrition : ${streak} jour${streak > 1 ? 's' : ''}`

  return (
    <div className={cn('flex w-full items-center justify-between gap-3', className)}>
      <button
        type="button"
        onClick={onStreakClick}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={streakLabel}
      >
        <NutritionStreakPill
          streak={streak}
          isFrozen={isFrozen}
          className={cn(
            'px-3 py-1.5 text-sm transition-transform',
            bump && 'animate-nutrition-streak-bump',
            !isFrozen && validatedToday && streak > 0 && 'animate-nutrition-streak-pulse',
          )}
        />
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-full bg-soft-secondary text-soft-secondary-fg hover:bg-soft-secondary/80"
        onClick={onCalendarClick}
        aria-label="Ouvrir le calendrier nutrition"
      >
        <CalendarDays className="size-4" />
      </Button>
    </div>
  )
}
