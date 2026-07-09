import { Crown, User } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProfileInitials } from '@/lib/stats/workout-metrics'
import { cn } from '@/lib/utils'

type UserAvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: 'size-9',
  md: 'size-10',
  lg: 'size-11',
  xl: 'size-16',
  '2xl': 'size-24',
}

const badgeSizeClasses: Record<UserAvatarSize, string> = {
  sm: 'size-4',
  md: 'size-4',
  lg: 'size-4.5',
  xl: 'size-5',
  '2xl': 'size-6',
}

const fallbackIconClasses: Record<UserAvatarSize, string> = {
  sm: 'size-4',
  md: 'size-4.5',
  lg: 'size-5',
  xl: 'size-7',
  '2xl': 'size-10',
}

function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  const trimmed = avatarUrl?.trim()
  return trimmed ? trimmed : null
}

type UserAvatarProps = {
  displayName: string
  avatarUrl?: string | null
  isPremium?: boolean
  size?: UserAvatarSize
  className?: string
}

export function UserAvatar({
  displayName,
  avatarUrl,
  isPremium = false,
  size = 'md',
  className,
}: UserAvatarProps) {
  const resolvedAvatarUrl = resolveAvatarUrl(avatarUrl)
  const initials = getProfileInitials(displayName)

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          'border border-border bg-primary/15',
        )}
      >
        {resolvedAvatarUrl ? (
          <AvatarImage src={resolvedAvatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback
          delayMs={0}
          className={cn(
            'bg-primary/15 font-bold text-primary',
            size === 'xl' || size === '2xl'
              ? 'font-display text-lg font-black'
              : 'text-xs',
          )}
        >
          {initials ? (
            initials
          ) : (
            <User className={fallbackIconClasses[size]} aria-hidden />
          )}
        </AvatarFallback>
      </Avatar>
      {isPremium ? (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card',
            badgeSizeClasses[size],
          )}
          aria-label="Compte Premium"
          title="Premium"
        >
          <Crown className="size-2.5" aria-hidden />
        </span>
      ) : null}
    </span>
  )
}
