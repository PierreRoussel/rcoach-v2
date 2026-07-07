import { Check, X } from 'lucide-react'

import { UserAvatar } from '@/components/profile/UserAvatar'
import { Button } from '@/components/ui/button'

type FriendRequestRowProps = {
  displayName: string
  avatarUrl: string | null
  isPremium?: boolean
  subtitle?: string
  isResponding?: boolean
  onAccept: () => void
  onDecline: () => void
}

export function FriendRequestRow({
  displayName,
  avatarUrl,
  isPremium = false,
  subtitle = 'Souhaite vous ajouter en ami',
  isResponding = false,
  onAccept,
  onDecline,
}: FriendRequestRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-soft-primary/20 p-3">
      <UserAvatar
        displayName={displayName}
        avatarUrl={avatarUrl}
        isPremium={isPremium}
        size="lg"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-black text-foreground">{displayName}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-9 rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
          aria-label={`Accepter ${displayName}`}
          disabled={isResponding}
          onClick={onAccept}
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="size-9 rounded-full border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          aria-label={`Refuser ${displayName}`}
          disabled={isResponding}
          onClick={onDecline}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
