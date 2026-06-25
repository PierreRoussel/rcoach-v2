import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

import { MotivationRevealOverlay } from '@/components/social/MotivationRevealOverlay'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimateIn } from '@/design-system'
import { useUnreadMotivations } from '@/hooks/useFriends'
import { toReceivedMotivationNotification } from '@/lib/social/motivation-notifications'
import type { MotivationNotification } from '@/lib/social/motivation-notifications'
import { getProfileInitials } from '@/lib/stats/workout-metrics'
import { cn } from '@/lib/utils'

export function MotivationHomeNotificationTile() {
  const { data: unreadMotivations = [], isLoading } = useUnreadMotivations()
  const [activeNotification, setActiveNotification] = useState<MotivationNotification | null>(
    null,
  )

  const latest = unreadMotivations[0] ?? null

  if (isLoading || !latest) {
    return null
  }

  const senderName = latest.sender?.display_name ?? 'Un ami'
  const extraCount = unreadMotivations.length - 1

  return (
    <>
      <AnimateIn delay={0}>
        <button
        type="button"
        onClick={() => setActiveNotification(toReceivedMotivationNotification(latest))}
        className={cn(
          'w-full rounded-2xl border border-primary/35 p-4 text-left shadow-sm',
          'bg-gradient-to-br from-soft-primary via-card to-soft-accent',
          'transition-transform active:scale-[0.99]',
        )}
        aria-label={`${senderName} vous a envoye un emoji ${latest.emoji}`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border-2 border-primary/25">
            <AvatarImage src={latest.sender?.avatar_url ?? undefined} alt={senderName} />
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {getProfileInitials(senderName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
              Nouveau message
            </p>
            <p className="font-display text-sm font-black leading-snug text-foreground">
              {senderName} vous a envoyé un emoji
            </p>
            {extraCount > 0 ? (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                +{extraCount} autre{extraCount > 1 ? 's' : ''} en attente
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="text-4xl leading-none">{latest.emoji}</span>
            <ChevronRight className="size-4 text-primary/70" />
          </div>
        </div>
      </button>
      </AnimateIn>

      <MotivationRevealOverlay
        notification={activeNotification}
        onClose={() => setActiveNotification(null)}
      />
    </>
  )
}
