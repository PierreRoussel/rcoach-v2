import { Crown } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getProfileInitials } from '@/lib/stats/workout-metrics'
import { cn } from '@/lib/utils'

type UserAvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: 'size-9',
  md: 'size-10',
  lg: 'size-11',
  xl: 'size-16',
}

const badgeSizeClasses: Record<UserAvatarSize, string> = {
  sm: 'size-4',
  md: 'size-4',
  lg: 'size-4.5',
  xl: 'size-5',
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
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={cn(sizeClasses[size], 'border border-border')}>
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback
          className={cn(
            'bg-soft-primary font-bold text-primary',
            size === 'xl' ? 'font-display text-lg font-black' : 'text-xs',
          )}
        >
          {getProfileInitials(displayName)}
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
