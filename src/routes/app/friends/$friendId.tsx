import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'

import { BadgeShelf } from '@/components/gamification/BadgeShelf'
import { WorkoutStreakIcon } from '@/components/schedule/WorkoutStreakIcon'
import { NutritionStreakPill } from '@/components/nutrition/NutritionStreakPill'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { FriendMotivationSendButton } from '@/components/social/FriendMotivationSendButton'
import { MotivationPickerDialog } from '@/components/social/MotivationPickerDialog'
import { WorkoutHistoryCard } from '@/components/workout/WorkoutHistoryCard'
import { Button } from '@/components/ui/button'
import { PageHeader, Pill } from '@/design-system'
import { buildBadgeShelfItems } from '@/hooks/useBadges'
import { useFriendProfile } from '@/hooks/useFriends'
import { useSentMotivations } from '@/hooks/useFriends'
import { requireAuth } from '@/lib/auth/guards'
import { summarizeFriendActivity } from '@/lib/social/friend-activity'
import { getSentMotivationDisplay } from '@/lib/social/sent-motivation'

export const Route = createFileRoute('/app/friends/$friendId')({
  beforeLoad: requireAuth,
  component: FriendProfilePage,
})

function FriendProfilePage() {
  const { friendId } = Route.useParams()
  const { data: friend, isLoading, error } = useFriendProfile(friendId)
  const { data: sentMotivations = [] } = useSentMotivations()
  const [motivationOpen, setMotivationOpen] = useState(false)

  const activity = useMemo(() => {
    if (!friend) {
      return null
    }

    return summarizeFriendActivity(friend)
  }, [friend])

  const badgeItems = useMemo(
    () => buildBadgeShelfItems(friend?.user_badges ?? []),
    [friend?.user_badges],
  )

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du profil...</p>
  }

  if (error || !friend) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link to="/app/friends">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        </Button>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Profil ami introuvable.'}
        </p>
      </div>
    )
  }

  const latestWorkout = friend.workouts[0] ?? null

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="rounded-full" asChild>
        <Link to="/app/friends">
          <ArrowLeft className="size-4" />
          Retour aux amis
        </Link>
      </Button>

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center">
        <UserAvatar
          displayName={friend.display_name}
          avatarUrl={friend.avatar_url}
          isPremium={friend.is_premium ?? false}
          size="2xl"
        />
        <div>
          <h1 className="font-display text-2xl font-black">{friend.display_name}</h1>
          {activity ? (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <Pill tone="solid-purple" className="gap-1 py-0.5 text-[10px]">
                <WorkoutStreakIcon variant="on-accent" className="size-3" />
                {activity.workoutStreak} sem.
              </Pill>
              <NutritionStreakPill
                streak={activity.nutritionStreak}
                format="compact"
                className="gap-1 py-0.5 text-[10px]"
              />
            </div>
          ) : null}
        </div>

        <FriendMotivationSendButton
          friendName={friend.display_name}
          variant="soft"
          sentDisplay={getSentMotivationDisplay(sentMotivations, friend.id)}
          onSend={() => setMotivationOpen(true)}
        />
      </section>

      <BadgeShelf
        items={badgeItems}
        title="Médailles"
        description="Accomplissements de votre ami."
        compact
      />

      <section className="space-y-3">
        <PageHeader
          eyebrow="Activité"
          title="Dernières séances"
          description={
            latestWorkout
              ? 'Les séances récentes partagées avec vos amis.'
              : 'Aucune séance récente enregistrée.'
          }
        />

        {friend.workouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Votre ami n&apos;a pas encore de séance récente à afficher.
          </div>
        ) : (
          <div className="space-y-2">
            {friend.workouts.map((workout) => (
              <WorkoutHistoryCard
                key={workout.id}
                workout={workout}
                profile={{
                  display_name: friend.display_name,
                  avatar_url: friend.avatar_url,
                  is_premium: friend.is_premium ?? false,
                }}
                allWorkouts={friend.workouts}
                readOnly
                variant="embedded"
              />
            ))}
          </div>
        )}
      </section>

      <MotivationPickerDialog
        open={motivationOpen}
        onOpenChange={setMotivationOpen}
        recipientId={friend.id}
        recipientName={friend.display_name}
      />
    </div>
  )
}
