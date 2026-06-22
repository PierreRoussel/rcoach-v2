import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  formatWorkoutDateTime,
  formatWorkoutVolume,
  getProfileInitials,
} from '@/lib/stats/workout-metrics'

export type WorkoutSummaryHeaderProps = {
  displayName: string
  avatarUrl: string | null
  startedAt: string
  title: string
  duration: string | null
  volumeKg: number
  recordsCount: number
  compact?: boolean
  className?: string
  actions?: ReactNode
}

function WorkoutStat({
  label,
  value,
  compact,
}: {
  label: string
  value: ReactNode
  compact?: boolean
}) {
  return (
    <div className="min-w-0 flex-1">
      <p
        className={cn(
          'font-medium text-muted-foreground',
          compact ? 'text-[11px]' : 'text-xs',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'font-display font-black text-foreground',
          compact ? 'mt-0.5 text-sm' : 'mt-1 text-base',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function WorkoutSummaryHeader({
  displayName,
  avatarUrl,
  startedAt,
  title,
  duration,
  volumeKg,
  recordsCount,
  compact = false,
  className,
  actions,
}: WorkoutSummaryHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Avatar className={cn(compact ? 'size-9' : 'size-10')}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="bg-soft-primary text-xs font-bold text-primary">
            {getProfileInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p
            className={cn(
              'truncate font-display font-black text-foreground',
              compact ? 'text-sm' : 'text-base',
            )}
          >
            {displayName}
          </p>
          <p className="font-data text-xs text-muted-foreground">
            {formatWorkoutDateTime(startedAt)}
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <h2
          className={cn(
            'min-w-0 font-display font-black text-foreground',
            compact ? 'text-lg' : 'text-xl',
          )}
        >
          {title}
        </h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="flex gap-4 border-b border-border pb-3">
        <WorkoutStat
          label="Durée"
          value={duration ?? '—'}
          compact={compact}
        />
        <WorkoutStat
          label="Volume"
          value={formatWorkoutVolume(volumeKg)}
          compact={compact}
        />
        <WorkoutStat
          label="Records"
          value={
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>🥇</span>
              {recordsCount}
            </span>
          }
          compact={compact}
        />
      </div>
    </div>
  )
}
