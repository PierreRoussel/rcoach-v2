import { Check, SmilePlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getSentMotivationStatusLabel,
  type SentMotivationDisplay,
} from '@/lib/social/sent-motivation'

type FriendMotivationSendButtonProps = {
  friendName: string
  sentDisplay: SentMotivationDisplay | null
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
          ? 'size-3 bg-secondary text-secondary-foreground'
          : 'size-2 bg-primary',
      )}
      aria-hidden
    >
      {isRead ? <Check className="size-2 stroke-[3]" /> : null}
    </span>
  )
}

export function FriendMotivationSendButton({
  friendName,
  sentDisplay,
  onSend,
  variant = 'icon',
  className,
}: FriendMotivationSendButtonProps) {
  const statusTitle = sentDisplay ? getSentMotivationStatusLabel(sentDisplay) : undefined

  if (variant === 'soft') {
    return (
      <Button
        type="button"
        size="sm"
        variant="soft"
        className={cn('relative min-w-[3.5rem]', className)}
        title={statusTitle}
        aria-label={`Envoyer un emoji a ${friendName}`}
        onClick={onSend}
      >
        {sentDisplay ? (
          <span className="relative inline-flex items-center">
            <span className="text-lg leading-none">{sentDisplay.motivation.emoji}</span>
            <ReadStatusBadge isRead={sentDisplay.isRead} />
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
      title={statusTitle}
      aria-label={`Envoyer un emoji a ${friendName}`}
      onClick={onSend}
    >
      {sentDisplay ? (
        <span className="relative inline-flex items-center justify-center">
          <span className="text-xl leading-none">{sentDisplay.motivation.emoji}</span>
          <ReadStatusBadge isRead={sentDisplay.isRead} />
        </span>
      ) : (
        <SmilePlus className="size-4" />
      )}
    </Button>
  )
}
