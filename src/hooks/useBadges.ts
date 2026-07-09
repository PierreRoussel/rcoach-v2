import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

import {
  BADGE_CATALOG,
  getBadgeDefinition,
  type BadgeDefinition,
  type BadgeKey,
} from '@/lib/gamification/badges'
import {
  computeTotalVolumeKg,
  countTotalPersonalRecords,
  evaluateEligibleBadges,
  findNewBadgeKeys,
} from '@/lib/gamification/badge-evaluation'
import {
  INSERT_USER_BADGE,
  LIST_MY_BADGES,
  LIST_NUTRITION_STREAK_VALIDATED_DAYS,
  type UserBadge,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { computeActiveStreak } from '@/lib/nutrition/streak-gamification'
import { toDateKey } from '@/lib/nutrition/dates'
import { computeWeeklyStreak } from '@/lib/schedule/weekly-streak'
import {
  NUTRITION_STREAK_LOOKBACK_DAYS,
} from '@/lib/stats/streak-lookback'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useStatsWorkouts } from '@/hooks/useStatsWorkouts'
import { useWorkoutStreakDates } from '@/hooks/useWorkouts'

const BADGES_QUERY_KEY = ['user-badges']

export type BadgeShelfItem = BadgeDefinition & {
  unlocked: boolean
  unlockedAt: string | null
}

function badgesQueryKey(userId: string | undefined) {
  return [...BADGES_QUERY_KEY, userId]
}

export function useMyBadges() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: badgesQueryKey(userId),
    enabled: isAuthenticated && Boolean(userId),
    queryFn: async () => {
      const data = await graphqlRequest<{ user_badges: UserBadge[] }>(
        nhost,
        LIST_MY_BADGES,
        { userId: userId! },
      )
      return data.user_badges
    },
  })
}

export function buildBadgeShelfItems(unlockedBadges: UserBadge[]): BadgeShelfItem[] {
  const unlockedMap = new Map(
    unlockedBadges.map((badge) => [badge.badge_key, badge.unlocked_at]),
  )

  return BADGE_CATALOG.map((badge) => ({
    ...badge,
    unlocked: unlockedMap.has(badge.key),
    unlockedAt: unlockedMap.get(badge.key) ?? null,
  }))
}

async function fetchNutritionStreak(userId: string, nhost: ReturnType<typeof useAuth>['nhost']) {
  const from = format(subDays(new Date(), NUTRITION_STREAK_LOOKBACK_DAYS), 'yyyy-MM-dd')
  const data = await graphqlRequest<{
    nutrition_streak_validated_days: Array<{ validated_date: string }>
  }>(nhost, LIST_NUTRITION_STREAK_VALIDATED_DAYS, { from, userId })

  const validatedDates = new Set(
    data.nutrition_streak_validated_days.map((day) => day.validated_date),
  )

  return computeActiveStreak(validatedDates, toDateKey(new Date()))
}

export function useSyncMyBadges() {
  const { nhost, user } = useAuth()
  const userId = user?.id
  const queryClient = useQueryClient()
  const { workouts } = useStatsWorkouts('all')
  const { data: streakWorkouts = [] } = useWorkoutStreakDates()

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        return [] as BadgeKey[]
      }

      let existingBadges: UserBadge[] = []
      try {
        const data = await graphqlRequest<{ user_badges: UserBadge[] }>(
          nhost,
          LIST_MY_BADGES,
          { userId },
        )
        existingBadges = data.user_badges
      } catch {
        return []
      }

      const nutritionStreak = await fetchNutritionStreak(userId, nhost).catch(() => 0)
      const workoutWeeklyStreak = computeWeeklyStreak(streakWorkouts)
      const totalSessions = workouts.length
      const totalVolumeKg = computeTotalVolumeKg(workouts)
      const totalPrCount = countTotalPersonalRecords(workouts)

      const eligible = evaluateEligibleBadges({
        nutritionStreak,
        workoutWeeklyStreak,
        totalSessions,
        totalVolumeKg,
        totalPrCount,
      })

      const newKeys = findNewBadgeKeys(
        eligible,
        existingBadges.map((badge) => badge.badge_key),
      )

      const inserted: BadgeKey[] = []
      for (const badgeKey of newKeys) {
        try {
          await graphqlRequest(nhost, INSERT_USER_BADGE, { badgeKey })
          inserted.push(badgeKey)
        } catch {
          // Schema not deployed yet or duplicate race — ignore.
        }
      }

      return inserted
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BADGES_QUERY_KEY })
    },
  })
}

export function getUnlockedBadgeDefinitions(badges: UserBadge[]): BadgeDefinition[] {
  return badges
    .map((badge) => getBadgeDefinition(badge.badge_key))
    .filter((badge): badge is BadgeDefinition => badge != null)
}
