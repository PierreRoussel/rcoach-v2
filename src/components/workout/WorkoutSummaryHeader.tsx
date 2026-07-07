import type { ReactNode } from 'react'

import { UserAvatar } from '@/components/profile/UserAvatar'
import {
  formatWorkoutDateTime,
  formatWorkoutVolume,
} from '@/lib/stats/workout-metrics'
import { cn } from '@/lib/utils'

export type WorkoutSummaryHeaderProps = {
  displayName: string
  avatarUrl: string | null
  isPremium?: boolean
  startedAt: string
  title: string
  duration: string | null
  volumeKg: number
  recordsCount: number
  compact?: boolean
  className?: string
  actions?: ReactNode
  onRecordsClick?: () => void
}

function WorkoutStat({
  label,
  value,
  compact,
  onClick,
}: {
  label: string
  value: ReactNode
  compact?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
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
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 rounded-xl text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Voir les ${label.toLowerCase()}`}
      >
        {content}
      </button>
    )
  }

  return <div className="min-w-0 flex-1">{content}</div>
}

export function WorkoutSummaryHeader({
  displayName,
  avatarUrl,
  isPremium = false,
  startedAt,
  title,
  duration,
  volumeKg,
  recordsCount,
  compact = false,
  className,
  actions,
  onRecordsClick,
}: WorkoutSummaryHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <UserAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          isPremium={isPremium}
          size={compact ? 'sm' : 'md'}
        />
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

      <div className="grid grid-cols-3 gap-3 border-b border-border pb-3">
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
          onClick={recordsCount > 0 ? onRecordsClick : undefined}
        />
      </div>
    </div>
  )
}
