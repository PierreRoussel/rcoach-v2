import { Flame, SmilePlus, Dumbbell } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import type { FriendMotivation } from '@/lib/graphql/operations'
import type { FriendActivitySummary } from '@/lib/social/friend-activity'
import { getProfileInitials } from '@/lib/stats/workout-metrics'

type FriendRecapRowProps = {
  displayName: string
  avatarUrl: string | null
  activity: FriendActivitySummary
  unreadMotivation: FriendMotivation | null
  onSendMotivation: () => void
  onOpenMotivation: () => void
}

export function FriendRecapRow({
  displayName,
  avatarUrl,
  activity,
  unreadMotivation,
  onSendMotivation,
  onOpenMotivation,
}: FriendRecapRowProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {unreadMotivation ? (
        <button
          type="button"
          onClick={onOpenMotivation}
          className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          <span className="text-base leading-none">{unreadMotivation.emoji}</span>
          <span>Nouveau message de motivation</span>
        </button>
      ) : null}

      <div className={`flex items-center gap-3 p-3 ${unreadMotivation ? 'pt-10' : ''}`}>
        <Avatar className="size-11 border border-border">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback className="text-xs font-bold">
            {getProfileInitials(displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-black text-foreground">{displayName}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill tone="purple" className="gap-1 py-0.5 text-[10px]">
              <Dumbbell className="size-3" />
              {activity.workoutStreak} sem.
            </Pill>
            <Pill tone="accent" className="gap-1 py-0.5 text-[10px]">
              <Flame className="size-3" />
              {activity.nutritionStreak} j.
            </Pill>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label={`Envoyer un emoji à ${displayName}`}
          onClick={onSendMotivation}
        >
          <SmilePlus className="size-4" />
        </Button>
      </div>
    </div>
  )
}
