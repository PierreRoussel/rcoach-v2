import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, Copy, Loader2, UserMinus, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { UserAvatar } from '@/components/profile/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FriendMotivationSendButton } from '@/components/social/FriendMotivationSendButton'
import { MotivationPickerDialog } from '@/components/social/MotivationPickerDialog'
import { FriendRequestRow } from '@/components/social/FriendRequestRow'
import { PageHeader } from '@/design-system'
import {
  useFriendships,
  useInviteFriend,
  useRemoveFriend,
  useRespondFriendRequest,
  useSentMotivations,
} from '@/hooks/useFriends'
import { useMyProfile } from '@/hooks/useProfile'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { isValidFriendCode, normalizeFriendCode } from '@/lib/social/friend-code'
import { getFriendProfile } from '@/lib/social/friend-utils'
import { getSentMotivationDisplay } from '@/lib/social/sent-motivation'

export const Route = createFileRoute('/app/friends/')({
  component: FriendsPage,
})

function FriendsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: profile } = useMyProfile()
  const friendshipsQuery = useFriendships()
  const inviteFriend = useInviteFriend()
  const respondRequest = useRespondFriendRequest()
  const removeFriend = useRemoveFriend()
  const { data: sentMotivations = [] } = useSentMotivations()

  const [inviteMode, setInviteMode] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [friendCode, setFriendCode] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [motivationTarget, setMotivationTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  const friendships = friendshipsQuery.data ?? []

  const pendingIncoming = useMemo(
    () =>
      friendships.filter(
        (friendship) =>
          friendship.status === 'pending' && friendship.addressee_id === userId,
      ),
    [friendships, userId],
  )

  const pendingOutgoing = useMemo(
    () =>
      friendships.filter(
        (friendship) =>
          friendship.status === 'pending' && friendship.requester_id === userId,
      ),
    [friendships, userId],
  )

  const acceptedFriends = useMemo(
    () =>
      friendships
        .filter((friendship) => friendship.status === 'accepted')
        .map((friendship) => ({
          friendship,
          friend: getFriendProfile(friendship, userId),
        }))
        .filter((item): item is typeof item & { friend: NonNullable<typeof item.friend> } =>
          Boolean(item.friend),
        ),
    [friendships, userId],
  )

  async function handleCopyCode() {
    if (!profile?.friend_code) {
      return
    }

    await navigator.clipboard.writeText(profile.friend_code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function handleInvite() {
    setSuccessMessage(null)
    setInviteError(null)

    try {
      if (inviteMode === 'code') {
        const normalized = normalizeFriendCode(friendCode)
        if (!isValidFriendCode(normalized)) {
          throw new Error('Format attendu : RCOACH-XXXXXX')
        }
        await inviteFriend.mutateAsync({ friendCode: normalized })
        setFriendCode('')
      } else {
        await inviteFriend.mutateAsync({ email })
        setEmail('')
      }
      setSuccessMessage('Invitation envoyée.')
    } catch (error) {
      setInviteError(
        error instanceof Error
          ? error.message
          : 'Impossible d’envoyer l’invitation.',
      )
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Communauté"
        title="Mes amis"
        description="Ajoutez des amis par email ou code, puis envoyez-leur des encouragements."
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Mon code ami</CardTitle>
          <CardDescription>
            Partagez ce code pour qu’on vous ajoute sans email.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <code className="rounded-xl bg-muted px-3 py-2 font-data text-sm">
            {profile?.friend_code ?? '...'}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => void handleCopyCode()}
            disabled={!profile?.friend_code}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Ajouter un ami</CardTitle>
          <CardDescription>
            Une demande doit être acceptée des deux côtés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={inviteMode === 'email' ? 'pill' : 'outline'}
              size="sm"
              onClick={() => setInviteMode('email')}
            >
              Email
            </Button>
            <Button
              type="button"
              variant={inviteMode === 'code' ? 'pill' : 'outline'}
              size="sm"
              onClick={() => setInviteMode('code')}
            >
              Code
            </Button>
          </div>

          {inviteMode === 'email' ? (
            <div className="space-y-2">
              <Label htmlFor="friend-email">Email de votre ami</Label>
              <Input
                id="friend-email"
                type="email"
                value={email}
                placeholder="ami@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="friend-code">Code ami</Label>
              <Input
                id="friend-code"
                value={friendCode}
                placeholder="RCOACH-ABC123"
                onChange={(event) => setFriendCode(event.target.value.toUpperCase())}
              />
            </div>
          )}

          <Button
            type="button"
            variant="pill"
            disabled={inviteFriend.isPending}
            onClick={() => void handleInvite()}
          >
            {inviteFriend.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Envoyer l’invitation
          </Button>

          {successMessage ? (
            <FeedbackMessage variant="success">{successMessage}</FeedbackMessage>
          ) : null}
          {inviteError ? (
            <FeedbackMessage variant="error">{inviteError}</FeedbackMessage>
          ) : null}
        </CardContent>
      </Card>

      {pendingIncoming.length > 0 ? (
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">Demandes reçues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingIncoming.map((friendship) => {
              const requester = friendship.requester
              const name =
                requester?.display_name ??
                friendship.invited_email ??
                'Utilisateur'

              return (
                <FriendRequestRow
                  key={friendship.id}
                  displayName={name}
                  avatarUrl={requester?.avatar_url ?? null}
                  isPremium={requester?.is_premium ?? false}
                  isResponding={respondRequest.isPending}
                  onAccept={() =>
                    void respondRequest.mutateAsync({
                      friendshipId: friendship.id,
                      accept: true,
                    })
                  }
                  onDecline={() =>
                    void respondRequest.mutateAsync({
                      friendshipId: friendship.id,
                      accept: false,
                    })
                  }
                />
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {pendingOutgoing.length > 0 ? (
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-display font-black">En attente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingOutgoing.map((friendship) => {
              const friend = getFriendProfile(friendship, userId)
              const label =
                friend?.display_name ?? friendship.invited_email ?? 'Invitation'

              return (
                <div
                  key={friendship.id}
                  className="rounded-2xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
                >
                  {label} — en attente d’acceptation
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="font-display font-black">Tous mes amis</CardTitle>
          <CardDescription>
            {acceptedFriends.length === 0
              ? 'Aucun ami pour le moment.'
              : `${acceptedFriends.length} ami${acceptedFriends.length > 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {friendshipsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : null}

          {acceptedFriends.map(({ friendship, friend }) => (
            <div
              key={friendship.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  to="/app/friends/$friendId"
                  params={{ friendId: friend.id }}
                  className="flex min-w-0 items-center gap-3 rounded-xl transition-colors hover:bg-muted/30"
                >
                  <UserAvatar
                    displayName={friend.display_name}
                    avatarUrl={friend.avatar_url}
                    isPremium={friend.is_premium ?? false}
                    size="md"
                  />
                  <p className="truncate font-display font-bold">{friend.display_name}</p>
                </Link>
              </div>
              <div className="flex shrink-0 gap-2">
                <FriendMotivationSendButton
                  friendName={friend.display_name}
                  variant="soft"
                  sentDisplay={getSentMotivationDisplay(sentMotivations, friend.id)}
                  onSend={() =>
                    setMotivationTarget({
                      id: friend.id,
                      name: friend.display_name,
                    })
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Retirer ${friend.display_name}`}
                  disabled={removeFriend.isPending}
                  onClick={() => void removeFriend.mutateAsync(friendship.id)}
                >
                  <UserMinus className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <MotivationPickerDialog
        open={motivationTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setMotivationTarget(null)
          }
        }}
        recipientId={motivationTarget?.id ?? ''}
        recipientName={motivationTarget?.name ?? ''}
      />
    </div>
  )
}
