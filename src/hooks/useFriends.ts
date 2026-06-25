import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

import {
  COUNT_UNREAD_MOTIVATIONS,
  DELETE_FRIENDSHIP,
  INSERT_FRIEND_MOTIVATION,
  INSERT_FRIENDSHIP,
  LIST_ACCEPTED_FRIENDS_ACTIVITY,
  LIST_MY_FRIENDSHIPS,
  LIST_MY_SENT_MOTIVATIONS,
  LIST_MY_SENT_MOTIVATIONS_LEGACY,
  LIST_UNREAD_MOTIVATIONS,
  LIST_UNSEEN_HEART_REPLIES,
  MARK_MOTIVATION_READ,
  MARK_MOTIVATION_REPLY_SEEN,
  REPLY_FRIEND_MOTIVATION,
  SEARCH_PROFILE_BY_EMAIL,
  SEARCH_PROFILE_BY_FRIEND_CODE,
  UPDATE_FRIENDSHIP_STATUS,
  type FriendMotivation,
  type Friendship,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { summarizeFriendActivity } from '@/lib/social/friend-activity'
import { buildFriendRecapList, getFriendProfile } from '@/lib/social/friend-utils'
import {
  isValidMotivationMessage,
  normalizeMotivationMessage,
  type MotivationPresetKey,
} from '@/lib/social/motivation-presets'
import { useAuth } from '@/lib/nhost/AuthProvider'

const FRIENDS_QUERY_KEY = ['friends']
const UNREAD_MOTIVATIONS_KEY = ['friend-motivations', 'unread']
const SENT_MOTIVATIONS_KEY = ['friend-motivations', 'sent']

function friendsQueryKey(userId: string | undefined) {
  return [...FRIENDS_QUERY_KEY, userId]
}

export function useFriendships() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: friendsQueryKey(userId),
    enabled: isAuthenticated && Boolean(userId),
    queryFn: async () => {
      const data = await graphqlRequest<{ friendships: Friendship[] }>(
        nhost,
        LIST_MY_FRIENDSHIPS,
      )
      return data.friendships
    },
  })
}

export function useFriendsActivity() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const mealSince = format(subDays(new Date(), 400), 'yyyy-MM-dd')

  return useQuery({
    queryKey: [...FRIENDS_QUERY_KEY, 'activity', userId, mealSince],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{ friendships: Friendship[] }>(
        nhost,
        LIST_ACCEPTED_FRIENDS_ACTIVITY,
        { mealSince },
      )

      const accepted = data.friendships.filter(
        (friendship) => friendship.status === 'accepted',
      )

      return accepted
        .map((friendship) => {
          const friend = userId ? getFriendProfile(friendship, userId) : null
          if (!friend) {
            return null
          }

          return {
            friendship,
            friend,
            activity: summarizeFriendActivity(friend),
          }
        })
        .filter((item): item is NonNullable<typeof item> => item != null)
    },
  })
}

export function usePendingIncomingFriendRequests() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const friendshipsQuery = useFriendships()

  const pending =
    friendshipsQuery.data?.filter(
      (friendship) =>
        friendship.status === 'pending' && friendship.addressee_id === userId,
    ) ?? []

  return {
    pending,
    count: pending.length,
    isLoading: friendshipsQuery.isLoading,
    error: friendshipsQuery.error,
  }
}

export function useProfileNavBadgeCount() {
  const { data: unreadMotivations = 0 } = useUnreadMotivationsCount()
  const { count: pendingFriendRequests } = usePendingIncomingFriendRequests()

  return unreadMotivations + pendingFriendRequests
}

export function useFriendRecap(limit = 5) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const friendshipsQuery = useFriendships()
  const activityQuery = useFriendsActivity()
  const unreadQuery = useUnreadMotivations()
  const heartRepliesQuery = useUnseenHeartReplies()

  const acceptedFriendships =
    friendshipsQuery.data?.filter((friendship) => friendship.status === 'accepted') ?? []

  const recapItems = buildFriendRecapList(
    acceptedFriendships,
    unreadQuery.data ?? [],
    heartRepliesQuery.data ?? [],
    userId,
    limit,
  )

  const activityByFriendId = new Map(
    (activityQuery.data ?? []).map((item) => [item.friend.id, item.activity]),
  )

  return {
    items: recapItems.map((item) => ({
      ...item,
      activity: activityByFriendId.get(item.friend.id) ?? {
        friendId: item.friend.id,
        workoutStreak: 0,
        nutritionStreak: 0,
      },
    })),
    isLoading:
      friendshipsQuery.isLoading ||
      activityQuery.isLoading ||
      unreadQuery.isLoading ||
      heartRepliesQuery.isLoading,
    error:
      friendshipsQuery.error ??
      activityQuery.error ??
      unreadQuery.error ??
      heartRepliesQuery.error,
  }
}

export function useUnreadMotivationsCount() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: [...UNREAD_MOTIVATIONS_KEY, 'count', userId],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        incoming: { aggregate: { count: number } | null }
        heartReplies: { aggregate: { count: number } | null }
      }>(nhost, COUNT_UNREAD_MOTIVATIONS, { userId: userId! })

      return (
        (data.incoming.aggregate?.count ?? 0) + (data.heartReplies.aggregate?.count ?? 0)
      )
    },
  })
}

export function useUnreadMotivations() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: [...UNREAD_MOTIVATIONS_KEY, userId],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 30_000,
    queryFn: async () => {
      const data = await graphqlRequest<{ friend_motivations: FriendMotivation[] }>(
        nhost,
        LIST_UNREAD_MOTIVATIONS,
        { userId: userId! },
      )
      return data.friend_motivations
    },
  })
}

export function useUnseenHeartReplies() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: [...UNREAD_MOTIVATIONS_KEY, 'heart-replies', userId],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const data = await graphqlRequest<{ friend_motivations: FriendMotivation[] }>(
          nhost,
          LIST_UNSEEN_HEART_REPLIES,
          { userId: userId! },
        )
        return data.friend_motivations
      } catch (error) {
        if (isSenderReplySeenSchemaError(error)) {
          return []
        }
        throw error
      }
    },
  })
}

export function useSentMotivations() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: [...SENT_MOTIVATIONS_KEY, userId],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 30_000,
    queryFn: async () => {
      try {
        const data = await graphqlRequest<{ friend_motivations: FriendMotivation[] }>(
          nhost,
          LIST_MY_SENT_MOTIVATIONS,
          { userId: userId! },
        )
        return data.friend_motivations
      } catch (error) {
        if (!isSenderReplySeenSchemaError(error)) {
          throw error
        }

        const data = await graphqlRequest<{ friend_motivations: FriendMotivation[] }>(
          nhost,
          LIST_MY_SENT_MOTIVATIONS_LEGACY,
          { userId: userId! },
        )

        return data.friend_motivations.map((motivation) => ({
          ...motivation,
          sender_reply_seen_at: motivation.sender_reply_seen_at ?? null,
        }))
      }
    },
  })
}

function isSenderReplySeenSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('sender_reply_seen_at')
}

async function invalidateSocialQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: UNREAD_MOTIVATIONS_KEY }),
    queryClient.invalidateQueries({ queryKey: SENT_MOTIVATIONS_KEY }),
  ])
}

export function useInviteFriend() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      friendCode,
    }: {
      email?: string
      friendCode?: string
    }) => {
      const normalizedEmail = email?.trim().toLowerCase()
      const normalizedCode = friendCode?.trim().toUpperCase()

      if (normalizedCode) {
        const search = await graphqlRequest<{
          profiles: Array<{ id: string; display_name: string }>
        }>(nhost, SEARCH_PROFILE_BY_FRIEND_CODE, { code: normalizedCode })

        const target = search.profiles[0]
        if (!target) {
          throw new Error('Code ami introuvable.')
        }
        if (target.id === user?.id) {
          throw new Error('Vous ne pouvez pas vous ajouter vous-même.')
        }

        const data = await graphqlRequest<{ insert_friendships_one: Friendship }>(
          nhost,
          INSERT_FRIENDSHIP,
          {
            object: {
              addressee_id: target.id,
              status: 'pending',
            },
          },
        )
        return data.insert_friendships_one
      }

      if (!normalizedEmail) {
        throw new Error('Saisissez un email ou un code ami.')
      }

      const search = await graphqlRequest<{
        profiles: Array<{ id: string; display_name: string }>
      }>(nhost, SEARCH_PROFILE_BY_EMAIL, { email: normalizedEmail })

      const target = search.profiles[0]
      if (target?.id === user?.id) {
        throw new Error('Vous ne pouvez pas vous ajouter vous-même.')
      }

      const data = await graphqlRequest<{ insert_friendships_one: Friendship }>(
        nhost,
        INSERT_FRIENDSHIP,
        {
          object: target
            ? { addressee_id: target.id, status: 'pending' }
            : { invited_email: normalizedEmail, status: 'pending' },
        },
      )
      return data.insert_friendships_one
    },
    onSuccess: async () => {
      await invalidateSocialQueries(queryClient)
    },
  })
}

export function useRespondFriendRequest() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      friendshipId,
      accept,
    }: {
      friendshipId: string
      accept: boolean
    }) => {
      const data = await graphqlRequest<{
        update_friendships_by_pk: { id: string; status: string } | null
      }>(nhost, UPDATE_FRIENDSHIP_STATUS, {
        id: friendshipId,
        status: accept ? 'accepted' : 'declined',
      })
      return data.update_friendships_by_pk
    },
    onSuccess: async () => {
      await invalidateSocialQueries(queryClient)
    },
  })
}

export function useRemoveFriend() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const data = await graphqlRequest<{
        delete_friendships_by_pk: { id: string } | null
      }>(nhost, DELETE_FRIENDSHIP, { id: friendshipId })
      return data.delete_friendships_by_pk
    },
    onSuccess: async () => {
      await invalidateSocialQueries(queryClient)
    },
  })
}

export function useSendMotivation() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id

  return useMutation({
    mutationFn: async ({
      recipientId,
      emoji,
      message,
      presetKey,
    }: {
      recipientId: string
      emoji: string
      message: string
      presetKey: MotivationPresetKey
    }) => {
      const normalizedMessage = normalizeMotivationMessage(message)
      if (!isValidMotivationMessage(normalizedMessage)) {
        throw new Error('Ajoutez un court message de motivation.')
      }

      const data = await graphqlRequest<{
        insert_friend_motivations_one: FriendMotivation
      }>(nhost, INSERT_FRIEND_MOTIVATION, {
        object: {
          recipient_id: recipientId,
          emoji,
          message: normalizedMessage,
          preset_key: presetKey,
        },
      })
      return data.insert_friend_motivations_one
    },
    onMutate: async ({ recipientId, emoji, message, presetKey }) => {
      if (!userId) {
        return
      }

      await queryClient.cancelQueries({ queryKey: [...SENT_MOTIVATIONS_KEY, userId] })
      const previous = queryClient.getQueryData<FriendMotivation[]>([
        ...SENT_MOTIVATIONS_KEY,
        userId,
      ])

      const optimistic: FriendMotivation = {
        id: `optimistic-${Date.now()}`,
        sender_id: userId,
        recipient_id: recipientId,
        emoji,
        message: normalizeMotivationMessage(message),
        preset_key: presetKey,
        read_at: null,
        hearted_at: null,
        reply_message: null,
        sender_reply_seen_at: null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<FriendMotivation[]>(
        [...SENT_MOTIVATIONS_KEY, userId],
        [optimistic, ...(previous ?? [])],
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData([...SENT_MOTIVATIONS_KEY, userId], context.previous)
      }
    },
    onSuccess: async () => {
      await invalidateSocialQueries(queryClient)
    },
  })
}

export function useMarkMotivationRead() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (motivationId: string) => {
      const data = await graphqlRequest<{
        update_friend_motivations_by_pk: { id: string } | null
      }>(nhost, MARK_MOTIVATION_READ, {
        id: motivationId,
        readAt: new Date().toISOString(),
      })
      return data.update_friend_motivations_by_pk
    },
    onSuccess: async () => {
      await invalidateSocialQueries(queryClient)
    },
  })
}

export function useMarkMotivationReplySeen() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (motivationId: string) => {
      const data = await graphqlRequest<{
        update_friend_motivations_by_pk: { id: string } | null
      }>(nhost, MARK_MOTIVATION_REPLY_SEEN, {
        id: motivationId,
        seenAt: new Date().toISOString(),
      })
      return data.update_friend_motivations_by_pk
    },
    onSuccess: async () => {
      await invalidateSocialQueries(queryClient)
    },
  })
}

export function useReplyMotivation() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      motivationId,
      replyMessage,
    }: {
      motivationId: string
      replyMessage?: string
    }) => {
      const now = new Date().toISOString()
      const normalizedReply = replyMessage
        ? normalizeMotivationMessage(replyMessage)
        : null

      if (normalizedReply && !isValidMotivationMessage(normalizedReply)) {
        throw new Error('Message de réponse trop long.')
      }

      const data = await graphqlRequest<{
        update_friend_motivations_by_pk: { id: string } | null
      }>(nhost, REPLY_FRIEND_MOTIVATION, {
        id: motivationId,
        readAt: now,
        heartedAt: now,
        replyMessage: normalizedReply,
      })
      return data.update_friend_motivations_by_pk
    },
    onSuccess: async () => {
      await invalidateSocialQueries(queryClient)
    },
  })
}
