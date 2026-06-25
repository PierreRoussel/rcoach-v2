import { Check, SmilePlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getSentMotivationBlockedMessage,
  type SentMotivationState,
} from '@/lib/social/sent-motivation'

type FriendMotivationSendButtonProps = {
  friendName: string
  sentState: SentMotivationState | null
  onSend: () => void
  variant?: 'icon' | 'soft'
  className?: string
}

function ReadStatusBadge({ isRead }: { isRead: boolean }) {
  return (
    <span
      className={cn(
        'absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full ring-2 ring-card',
        isRead
          ? 'size-3.5 bg-secondary text-secondary-foreground'
          : 'size-2.5 bg-primary',
      )}
      aria-hidden
    >
      {isRead ? <Check className="size-2.5 stroke-[3]" /> : null}
    </span>
  )
}

function SentEmojiStatus({
  sentState,
  friendName,
  variant,
  className,
}: {
  sentState: SentMotivationState
  friendName: string
  variant: 'icon' | 'soft'
  className?: string
}) {
  const title = getSentMotivationBlockedMessage(sentState)

  if (variant === 'soft') {
    return (
      <div
        className={cn(
          'relative inline-flex min-w-[3.5rem] items-center justify-center rounded-full',
          'border border-primary/25 bg-soft-accent/50 px-3 py-1.5',
          className,
        )}
        title={title}
        aria-label={`${sentState.motivation.emoji} envoye a ${friendName}. ${title}`}
        role="status"
      >
        <span className="relative inline-flex items-center">
          <span className="text-lg leading-none">{sentState.motivation.emoji}</span>
          <ReadStatusBadge isRead={sentState.isRead} />
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center rounded-full',
        'border border-primary/25 bg-soft-accent/50',
        className,
      )}
      title={title}
      aria-label={`${sentState.motivation.emoji} envoye a ${friendName}. ${title}`}
      role="status"
    >
      <span className="text-xl leading-none">{sentState.motivation.emoji}</span>
      <ReadStatusBadge isRead={sentState.isRead} />
    </div>
  )
}

export function FriendMotivationSendButton({
  friendName,
  sentState,
  onSend,
  variant = 'icon',
  className,
}: FriendMotivationSendButtonProps) {
  if (sentState) {
    return (
      <SentEmojiStatus
        sentState={sentState}
        friendName={friendName}
        variant={variant}
        className={className}
      />
    )
  }

  if (variant === 'soft') {
    return (
      <Button
        type="button"
        size="sm"
        variant="soft"
        className={cn('min-w-[3.5rem]', className)}
        aria-label={`Envoyer un emoji a ${friendName}`}
        onClick={onSend}
      >
        Emoji
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('shrink-0 rounded-full', className)}
      aria-label={`Envoyer un emoji a ${friendName}`}
      onClick={onSend}
    >
      <SmilePlus className="size-4" />
    </Button>
  )
}
