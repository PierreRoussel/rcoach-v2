import { computeNutritionLoggingStreak } from '@/lib/nutrition/streak'
import { toDateKey } from '@/lib/nutrition/dates'
import type { WorkoutSummary } from '@/lib/graphql/operations'
import type { FriendProfileSummary } from '@/lib/graphql/operations'
import { computeWeeklyStreak } from '@/lib/schedule/weekly-streak'

export type FriendActivitySummary = {
  friendId: string
  workoutStreak: number
  nutritionStreak: number
}

export function summarizeFriendActivity(
  friend: FriendProfileSummary,
  now = new Date(),
): FriendActivitySummary {
  const workouts = friend.workouts as WorkoutSummary[]
  const loggedDates = friend.meal_log_entries.map((entry) => entry.logged_date)

  return {
    friendId: friend.id,
    workoutStreak: computeWeeklyStreak(workouts, now),
    nutritionStreak: computeNutritionLoggingStreak(loggedDates, toDateKey(now)),
  }
}
