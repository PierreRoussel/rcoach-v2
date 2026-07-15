import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'

import { MotivationRevealOverlay } from '@/components/social/MotivationRevealOverlay'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { useHomeMotivationNotifications } from '@/hooks/useFriends'
import type { MotivationNotification } from '@/lib/social/motivation-notifications'
import { cn } from '@/lib/utils'

function isAppHomePath(pathname: string) {
  return pathname === '/app' || pathname === '/app/'
}

export function MotivationHomeNotificationTile() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { latest, notifications, isPending, refetch } = useHomeMotivationNotifications()
  const [activeNotification, setActiveNotification] = useState<MotivationNotification | null>(
    null,
  )

  useEffect(() => {
    if (isAppHomePath(pathname)) {
      void refetch()
    }
  }, [pathname, refetch])

  if (isPending || !latest) {
    return null
  }

  const senderName =
    latest.kind === 'received'
      ? (latest.motivation.sender?.display_name ?? 'Un ami')
      : (latest.motivation.recipient?.display_name ?? 'Un ami')
  const senderAvatar =
    latest.kind === 'received'
      ? latest.motivation.sender?.avatar_url
      : latest.motivation.recipient?.avatar_url
  const senderPremium =
    latest.kind === 'received'
      ? (latest.motivation.sender?.is_premium ?? false)
      : (latest.motivation.recipient?.is_premium ?? false)
  const headline =
    latest.kind === 'received'
      ? `${senderName} vous a envoyé un emoji`
      : `${senderName} répond à votre emoji`
  const extraCount = notifications.length - 1

  return (
    <>
      <button
        type="button"
        onClick={() => setActiveNotification(latest)}
        className={cn(
          'w-full rounded-2xl border border-primary/35 p-4 text-left shadow-sm',
          'bg-gradient-to-br from-soft-primary via-card to-soft-accent',
          'transition-transform active:scale-[0.99]',
        )}
        aria-label={headline}
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            displayName={senderName}
            avatarUrl={senderAvatar}
            isPremium={senderPremium}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-soft-primary-fg">
              Nouveau message
            </p>
            <p className="font-display text-sm font-black leading-snug text-foreground">
              {headline}
            </p>
            {extraCount > 0 ? (
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                +{extraCount} autre{extraCount > 1 ? 's' : ''} en attente
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="text-4xl leading-none">{latest.bannerEmoji}</span>
            <ChevronRight className="size-4 text-soft-primary-fg" />
          </div>
        </div>
      </button>

      <MotivationRevealOverlay
        notification={activeNotification}
        onClose={() => setActiveNotification(null)}
      />
    </>
  )
}
