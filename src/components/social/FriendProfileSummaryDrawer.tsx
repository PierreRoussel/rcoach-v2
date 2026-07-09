import { useMemo } from 'react'

import { FriendProfileBadgeRow } from '@/components/gamification/FriendProfileBadgeRow'
import { WorkoutStreakIcon } from '@/components/schedule/WorkoutStreakIcon'
import { NutritionStreakPill } from '@/components/nutrition/NutritionStreakPill'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { FriendMotivationSendButton } from '@/components/social/FriendMotivationSendButton'
import { WorkoutHistoryCard } from '@/components/workout/WorkoutHistoryCard'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '@/components/ui/drawer'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Pill } from '@/design-system'
import { buildBadgeShelfItems } from '@/hooks/useBadges'
import { useBadgeCatalog } from '@/hooks/useBadgeCatalog'
import { useFriendProfileSummary } from '@/hooks/useFriends'
import type { FriendActivitySummary } from '@/lib/social/friend-activity'
import type { SentMotivationDisplay } from '@/lib/social/sent-motivation'

export type FriendProfileSummaryTarget = {
  id: string
  displayName: string
  avatarUrl: string | null
  isPremium: boolean
  activity: FriendActivitySummary
}

type FriendProfileSummaryDrawerProps = {
  friend: FriendProfileSummaryTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  sentDisplay: SentMotivationDisplay | null
  onSendMotivation: () => void
}

export function FriendProfileSummaryDrawer({
  friend,
  open,
  onOpenChange,
  sentDisplay,
  onSendMotivation,
}: FriendProfileSummaryDrawerProps) {
  const { data: catalog = [] } = useBadgeCatalog()
  const {
    data: profile,
    isLoading,
    error,
  } = useFriendProfileSummary(friend?.id, open)

  const badgeItems = useMemo(
    () => buildBadgeShelfItems(profile?.user_badges ?? [], catalog),
    [profile?.user_badges, catalog],
  )

  const unlockedCount = badgeItems.filter((item) => item.unlocked).length
  const showBadgeRow = isLoading || unlockedCount > 0
  const latestWorkout = profile?.workouts[0] ?? null

  if (!friend) {
    return null
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] rounded-t-[28px] border-t-0 bg-muted">
        <DrawerTitle className="sr-only">{friend.displayName}</DrawerTitle>
        <DrawerDescription className="sr-only">
          Résumé du profil, médailles et dernière séance.
        </DrawerDescription>

        <div className="mx-auto w-full max-w-lg overflow-y-auto px-5 pb-8 pt-2">
          <header className="mt-2 flex items-start gap-3.5">
            <UserAvatar
              displayName={friend.displayName}
              avatarUrl={friend.avatarUrl}
              isPremium={friend.isPremium}
              size="xl"
              className="ring-2 ring-primary/70 ring-offset-2 ring-offset-muted"
            />

            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="truncate font-display text-xl font-black leading-tight">
                {friend.displayName}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone="secondary" className="gap-1 py-0.5 text-[10px]">
                  <WorkoutStreakIcon className="size-3" />
                  {friend.activity.workoutStreak} sem.
                </Pill>
                <NutritionStreakPill
                  streak={friend.activity.nutritionStreak}
                  format="compact"
                  className="gap-1 py-0.5 text-[10px]"
                />
              </div>
            </div>

            <FriendMotivationSendButton
              friendName={friend.displayName}
              sentDisplay={sentDisplay}
              size="lg"
              onSend={onSendMotivation}
            />
          </header>

          {showBadgeRow ? (
            <div className="mt-5">
              <FriendProfileBadgeRow items={badgeItems} isLoading={isLoading} />
            </div>
          ) : null}

          {error ? (
            <div className="mt-4">
              <FeedbackMessage variant="error">
                {error instanceof Error ? error.message : 'Impossible de charger le profil.'}
              </FeedbackMessage>
            </div>
          ) : null}

          <section className="mt-5">
            <h3 className="mb-2 font-display text-sm font-black">Dernière séance</h3>

            {isLoading ? (
              <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-8">
                <div className="mx-auto h-4 w-2/3 animate-pulse rounded bg-muted-foreground/15" />
                <div className="mx-auto mt-3 h-3 w-1/2 animate-pulse rounded bg-muted-foreground/10" />
              </div>
            ) : latestWorkout ? (
              <WorkoutHistoryCard
                workout={latestWorkout}
                profile={{
                  display_name: friend.displayName,
                  avatar_url: friend.avatarUrl,
                  is_premium: friend.isPremium,
                }}
                allWorkouts={profile?.workouts ?? []}
                readOnly
                variant="embedded"
                className="bg-background/50"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-6 text-center text-sm text-muted-foreground">
                Aucune séance récente pour cette personne.
              </div>
            )}
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
