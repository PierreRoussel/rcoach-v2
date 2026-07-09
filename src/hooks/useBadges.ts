import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

import { useBadgeCatalog } from '@/hooks/useBadgeCatalog'
import {
  evaluateEligibleBadges,
  findNewBadgeKeys,
  computeTotalVolumeKg,
  countTotalPersonalRecords,
} from '@/lib/gamification/badge-evaluation'
import {
  getBadgeDefinitionFromCatalog,
  mapBadgeRecordToDefinition,
  type BadgeDefinition,
  type BadgeDefinitionRecord,
} from '@/lib/gamification/badges'
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
import { NUTRITION_STREAK_LOOKBACK_DAYS } from '@/lib/stats/streak-lookback'
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

export function buildBadgeShelfItems(
  unlockedBadges: UserBadge[],
  catalog: BadgeDefinitionRecord[],
): BadgeShelfItem[] {
  const unlockedMap = new Map(
    unlockedBadges.map((badge) => [badge.badge_key, badge.unlocked_at]),
  )

  return catalog.map((record) => {
    const definition = mapBadgeRecordToDefinition(record)
    return {
      ...definition,
      unlocked: unlockedMap.has(record.key),
      unlockedAt: unlockedMap.get(record.key) ?? null,
    }
  })
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
  const { data: catalog = [] } = useBadgeCatalog()

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        return [] as string[]
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

      const eligible = evaluateEligibleBadges(
        {
          nutritionStreak,
          workoutWeeklyStreak,
          totalSessions,
          totalVolumeKg,
          totalPrCount,
        },
        catalog,
      )

      const newKeys = findNewBadgeKeys(
        eligible,
        existingBadges.map((badge) => badge.badge_key),
      )

      const inserted: string[] = []
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

export function getUnlockedBadgeDefinitions(
  badges: UserBadge[],
  catalog: BadgeDefinitionRecord[],
): BadgeDefinition[] {
  return badges
    .map((badge) => getBadgeDefinitionFromCatalog(badge.badge_key, catalog))
    .filter((badge): badge is BadgeDefinition => badge != null)
}
