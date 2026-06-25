import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

import {
  COUNT_UNREAD_MOTIVATIONS,
  DELETE_FRIENDSHIP,
  INSERT_FRIEND_MOTIVATION,
  INSERT_FRIENDSHIP,
  LIST_ACCEPTED_FRIENDS_ACTIVITY,
  LIST_MY_FRIENDSHIPS,
  LIST_UNREAD_MOTIVATIONS,
  MARK_MOTIVATION_READ,
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

export function useFriendships() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: FRIENDS_QUERY_KEY,
    enabled: isAuthenticated,
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

export function useFriendRecap(limit = 5) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const friendshipsQuery = useFriendships()
  const activityQuery = useFriendsActivity()
  const unreadQuery = useUnreadMotivations()

  const acceptedFriendships =
    friendshipsQuery.data?.filter((friendship) => friendship.status === 'accepted') ?? []

  const recapItems = buildFriendRecapList(
    acceptedFriendships,
    unreadQuery.data ?? [],
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
      unreadQuery.isLoading,
    error: friendshipsQuery.error ?? activityQuery.error ?? unreadQuery.error,
  }
}

export function useUnreadMotivationsCount() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: [...UNREAD_MOTIVATIONS_KEY, 'count'],
    enabled: isAuthenticated,
    staleTime: 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        friend_motivations_aggregate: { aggregate: { count: number } | null }
      }>(nhost, COUNT_UNREAD_MOTIVATIONS)

      return data.friend_motivations_aggregate.aggregate?.count ?? 0
    },
  })
}

export function useUnreadMotivations() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: UNREAD_MOTIVATIONS_KEY,
    enabled: isAuthenticated,
    staleTime: 30_000,
    queryFn: async () => {
      const data = await graphqlRequest<{ friend_motivations: FriendMotivation[] }>(
        nhost,
        LIST_UNREAD_MOTIVATIONS,
      )
      return data.friend_motivations
    },
  })
}

async function invalidateSocialQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: UNREAD_MOTIVATIONS_KEY }),
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
  const { nhost, user } = useAuth()
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
        addresseeId: accept ? user?.id : undefined,
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
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

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
