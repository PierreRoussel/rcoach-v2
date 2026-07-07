import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Flame, Snowflake } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
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

  const label = isFrozen
    ? `Série gelée : ${streak} jour${streak > 1 ? 's' : ''}`
    : `Série nutrition : ${streak} jour${streak > 1 ? 's' : ''}`

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      <button
        type="button"
        onClick={onStreakClick}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={label}
      >
        <Pill
          tone={isFrozen ? 'default' : 'solid-primary'}
          className={cn(
            'shrink-0 shadow-sm transition-transform',
            bump && 'animate-nutrition-streak-bump',
            !isFrozen && validatedToday && streak > 0 && 'animate-nutrition-streak-pulse',
          )}
        >
          {isFrozen ? (
            <Snowflake className="size-3 text-sky-400" aria-hidden />
          ) : (
            <Flame className="size-3 fill-current" aria-hidden />
          )}
          {streak}
          {isFrozen ? (
            <span className="text-[10px] font-medium text-muted-foreground">gelé</span>
          ) : null}
        </Pill>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-full text-primary"
        onClick={onCalendarClick}
        aria-label="Ouvrir le calendrier nutrition"
      >
        <CalendarDays className="size-4" />
      </Button>
    </div>
  )
}
