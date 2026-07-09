import { Dumbbell } from 'lucide-react'

import { NutritionStreakPill } from '@/components/nutrition/NutritionStreakPill'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { FriendMotivationSendButton } from '@/components/social/FriendMotivationSendButton'
import { Pill } from '@/design-system'
import type { FriendActivitySummary } from '@/lib/social/friend-activity'
import type { MotivationNotification } from '@/lib/social/motivation-notifications'
import type { SentMotivationDisplay } from '@/lib/social/sent-motivation'

type FriendRecapRowProps = {
  displayName: string
  avatarUrl: string | null
  isPremium?: boolean
  activity: FriendActivitySummary
  motivationNotification: MotivationNotification | null
  sentDisplay: SentMotivationDisplay | null
  onSendMotivation: () => void
  onOpenMotivation: () => void
}

export function FriendRecapRow({
  displayName,
  avatarUrl,
  isPremium = false,
  activity,
  motivationNotification,
  sentDisplay,
  onSendMotivation,
  onOpenMotivation,
}: FriendRecapRowProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
      {motivationNotification ? (
        <button
          type="button"
          onClick={onOpenMotivation}
          className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          <span className="text-base leading-none">{motivationNotification.bannerEmoji}</span>
          <span>{motivationNotification.bannerLabel}</span>
        </button>
      ) : null}

      <div className={`flex items-center gap-3 p-3 ${motivationNotification ? 'pt-10' : ''}`}>
        <UserAvatar
          displayName={displayName}
          avatarUrl={avatarUrl}
          isPremium={isPremium}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-black text-foreground">{displayName}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill tone="solid-purple" className="gap-1 py-0.5 text-[10px]">
              <Dumbbell className="size-3" />
              {activity.workoutStreak} sem.
            </Pill>
            <NutritionStreakPill
              streak={activity.nutritionStreak}
              format="compact"
              className="gap-1 py-0.5 text-[10px]"
            />
          </div>
        </div>

        <FriendMotivationSendButton
          friendName={displayName}
          sentDisplay={sentDisplay}
          onSend={onSendMotivation}
        />
      </div>
    </div>
  )
}
