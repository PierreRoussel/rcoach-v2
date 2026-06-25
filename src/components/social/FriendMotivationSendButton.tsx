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

export function FriendMotivationSendButton({
  friendName,
  sentState,
  onSend,
  variant = 'icon',
  className,
}: FriendMotivationSendButtonProps) {
  const canSend = sentState == null
  const title = sentState ? getSentMotivationBlockedMessage(sentState) : undefined

  if (variant === 'soft') {
    return (
      <Button
        type="button"
        size="sm"
        variant="soft"
        className={cn('relative min-w-[3.5rem]', className)}
        disabled={!canSend}
        title={title}
        aria-label={
          canSend
            ? `Envoyer un emoji a ${friendName}`
            : `${sentState.motivation.emoji} envoye a ${friendName}. ${title}`
        }
        onClick={() => {
          if (canSend) {
            onSend()
          }
        }}
      >
        {sentState ? (
          <span className="relative inline-flex items-center">
            <span className="text-lg leading-none">{sentState.motivation.emoji}</span>
            <ReadStatusBadge isRead={sentState.isRead} />
          </span>
        ) : (
          'Emoji'
        )}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('relative shrink-0 rounded-full', className)}
      disabled={!canSend}
      title={title}
      aria-label={
        canSend
          ? `Envoyer un emoji a ${friendName}`
          : `${sentState.motivation.emoji} envoye a ${friendName}. ${title}`
      }
      onClick={() => {
        if (canSend) {
          onSend()
        }
      }}
    >
      {sentState ? (
        <span className="relative inline-flex items-center justify-center">
          <span className="text-xl leading-none">{sentState.motivation.emoji}</span>
          <ReadStatusBadge isRead={sentState.isRead} />
        </span>
      ) : (
        <SmilePlus className="size-4" />
      )}
    </Button>
  )
}
