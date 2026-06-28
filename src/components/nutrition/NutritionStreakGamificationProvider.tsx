import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { NutritionStreakCelebrationOverlay } from '@/components/nutrition/NutritionStreakCelebrationOverlay'
import { NutritionStreakRecoveryDialog } from '@/components/nutrition/NutritionStreakRecoveryDialog'
import {
  DELETE_NUTRITION_STREAK_RECOVERY,
  GET_NUTRITION_STREAK_RECOVERY,
  INSERT_NUTRITION_STREAK_VALIDATED_DAY,
  LIST_NUTRITION_STREAK_VALIDATED_DAYS,
  UPDATE_NUTRITION_STREAK_RECOVERY,
  UPSERT_NUTRITION_STREAK_RECOVERY,
  type NutritionStreakRecovery,
  type NutritionStreakValidatedDay,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { addDays, toDateKey } from '@/lib/nutrition/dates'
import {
  applyDayValidation,
  computeDisplayStreak,
  detectMissedDayState,
  isEligibleSameDayLog,
  isRecoveryExpired,
  reconcileStreakState,
  shouldShowRecoveryDialog,
  toValidatedDateSet,
  type RecoveryState,
  type StreakEvent,
} from '@/lib/nutrition/streak-gamification'
import type { StreakMilestone } from '@/lib/nutrition/streak-milestones'
import { NUTRITION_STREAK_LOOKBACK_DAYS } from '@/lib/stats/streak-lookback'
import { useAuth } from '@/lib/nhost/AuthProvider'

type CelebrationState = {
  streak: number
  milestone: StreakMilestone | null
}

type NutritionStreakGamificationContextValue = {
  displayStreak: number
  isFrozen: boolean
  recoveryProgress: number | null
  validatedToday: boolean
  isLoading: boolean
  error: Error | null
  validateTodayIfNeeded: (input: {
    loggedDate: string
    hadEntriesBefore: boolean
  }) => Promise<void>
  reconcileOnDietPageOpen: () => Promise<void>
  dismissRecoveryDialog: () => void
}

const NutritionStreakGamificationContext =
  createContext<NutritionStreakGamificationContextValue | null>(null)

function celebrationStorageKey(today: string) {
  return `nutrition-streak-celebration-${today}`
}

function recoveryDismissedStorageKey(today: string) {
  return `nutrition-streak-recovery-dismissed-${today}`
}

function mapRecoveryRow(row: NutritionStreakRecovery | null): RecoveryState | null {
  if (!row) {
    return null
  }

  return {
    frozenStreak: row.frozen_streak,
    progress: row.progress,
    startedOn: row.started_on,
  }
}

function useValidatedDaysQuery(userId: string | undefined, today: string) {
  const { nhost, isAuthenticated } = useAuth()
  const from = addDays(today, -NUTRITION_STREAK_LOOKBACK_DAYS)

  return useQuery({
    queryKey: ['nutrition-streak-validated', userId, from],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        nutrition_streak_validated_days: NutritionStreakValidatedDay[]
      }>(nhost, LIST_NUTRITION_STREAK_VALIDATED_DAYS, {
        from,
        userId: userId!,
      })

      return data.nutrition_streak_validated_days
    },
  })
}

function useRecoveryQuery(userId: string | undefined) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['nutrition-streak-recovery', userId],
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        nutrition_streak_recovery_by_pk: NutritionStreakRecovery | null
      }>(nhost, GET_NUTRITION_STREAK_RECOVERY, { userId: userId! })

      return data.nutrition_streak_recovery_by_pk
    },
  })
}

export function NutritionStreakGamificationProvider({
  children,
}: {
  children: ReactNode
}) {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()
  const today = toDateKey(new Date())

  const validatedQuery = useValidatedDaysQuery(user?.id, today)
  const recoveryQuery = useRecoveryQuery(user?.id)

  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false)
  const [recoveryDialogFrozenStreak, setRecoveryDialogFrozenStreak] = useState(0)

  const validatedDates = useMemo(
    () =>
      toValidatedDateSet(
        (validatedQuery.data ?? []).map((row) => row.validated_date),
      ),
    [validatedQuery.data],
  )

  const recovery = useMemo(
    () => mapRecoveryRow(recoveryQuery.data ?? null),
    [recoveryQuery.data],
  )

  const { streak: displayStreak, isFrozen, recoveryProgress } = useMemo(
    () => computeDisplayStreak(validatedDates, recovery, today),
    [validatedDates, recovery, today],
  )

  const invalidateStreakQueries = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['nutrition-streak-validated'] })
    await queryClient.invalidateQueries({ queryKey: ['nutrition-streak-recovery'] })
  }, [queryClient])

  const insertValidatedDay = useMutation({
    mutationFn: async (validatedDate: string) => {
      await graphqlRequest(nhost, INSERT_NUTRITION_STREAK_VALIDATED_DAY, {
        object: {
          validated_date: validatedDate,
          validated_at: new Date().toISOString(),
        },
      })
    },
    onSuccess: invalidateStreakQueries,
  })

  const upsertRecovery = useMutation({
    mutationFn: async (state: RecoveryState) => {
      await graphqlRequest(nhost, UPSERT_NUTRITION_STREAK_RECOVERY, {
        object: {
          frozen_streak: state.frozenStreak,
          progress: state.progress,
          started_on: state.startedOn,
          updated_at: new Date().toISOString(),
        },
      })
    },
    onSuccess: invalidateStreakQueries,
  })

  const updateRecovery = useMutation({
    mutationFn: async (state: RecoveryState) => {
      if (!user?.id) {
        return
      }

      await graphqlRequest(nhost, UPDATE_NUTRITION_STREAK_RECOVERY, {
        userId: user.id,
        changes: {
          frozen_streak: state.frozenStreak,
          progress: state.progress,
          started_on: state.startedOn,
          updated_at: new Date().toISOString(),
        },
      })
    },
    onSuccess: invalidateStreakQueries,
  })

  const deleteRecovery = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        return
      }

      await graphqlRequest(nhost, DELETE_NUTRITION_STREAK_RECOVERY, {
        userId: user.id,
      })
    },
    onSuccess: invalidateStreakQueries,
  })

  const handleStreakEvent = useCallback(
    (event: StreakEvent, validatedDate: string) => {
      if (event.kind === 'celebration' && event.firstLogToday) {
        if (sessionStorage.getItem(celebrationStorageKey(validatedDate)) === '1') {
          return
        }

        sessionStorage.setItem(celebrationStorageKey(validatedDate), '1')
        setCelebration({
          streak: event.streak,
          milestone: event.milestone,
        })
      }

      if (event.kind === 'recovery_complete') {
        setCelebration({
          streak: event.streak,
          milestone: null,
        })
      }
    },
    [],
  )

  const persistValidationResult = useCallback(
    async (
      validatedDate: string,
      nextRecovery: RecoveryState | null,
      previousRecovery: RecoveryState | null,
    ) => {
      await insertValidatedDay.mutateAsync(validatedDate)

      if (nextRecovery && !previousRecovery) {
        await upsertRecovery.mutateAsync(nextRecovery)
      } else if (nextRecovery && previousRecovery) {
        await updateRecovery.mutateAsync(nextRecovery)
      } else if (!nextRecovery && previousRecovery) {
        await deleteRecovery.mutateAsync()
      }
    },
    [deleteRecovery, insertValidatedDay, updateRecovery, upsertRecovery],
  )

  const validateTodayIfNeeded = useCallback(
    async ({
      loggedDate,
      hadEntriesBefore,
    }: {
      loggedDate: string
      hadEntriesBefore: boolean
    }) => {
      if (!user?.id || !isEligibleSameDayLog(loggedDate, today)) {
        return
      }

      const result = applyDayValidation(validatedDates, recovery, today, {
        hadEntriesBefore,
      })

      if (!result.isNewValidation) {
        return
      }

      try {
        await persistValidationResult(today, result.recovery, recovery)
        handleStreakEvent(result.event, today)
      } catch {
        // Offline or API failure — streak validation is best-effort until sync.
      }
    },
    [
      handleStreakEvent,
      persistValidationResult,
      recovery,
      today,
      user?.id,
      validatedDates,
    ],
  )

  const reconcileOnDietPageOpen = useCallback(async () => {
    if (!user?.id) {
      return
    }

    let activeRecovery = recovery

    if (activeRecovery && isRecoveryExpired(activeRecovery, validatedDates, today)) {
      try {
        await deleteRecovery.mutateAsync()
      } catch {
        return
      }
      activeRecovery = null
    }

    if (activeRecovery && activeRecovery.progress < 2) {
      const dismissedKey = sessionStorage.getItem(recoveryDismissedStorageKey(today))
      if (dismissedKey !== today) {
        setRecoveryDialogFrozenStreak(activeRecovery.frozenStreak)
        setRecoveryDialogOpen(true)
      }
      return
    }

    const missedState = detectMissedDayState(validatedDates, today)
    const reconcileResult = reconcileStreakState(validatedDates, null, today)

    if (reconcileResult.recovery && reconcileResult.shouldOpenRecoveryDialog) {
      try {
        await upsertRecovery.mutateAsync(reconcileResult.recovery)
      } catch {
        return
      }

      const dismissedKey = sessionStorage.getItem(recoveryDismissedStorageKey(today))
      if (
        shouldShowRecoveryDialog(missedState, null, dismissedKey, today)
      ) {
        setRecoveryDialogFrozenStreak(reconcileResult.recovery.frozenStreak)
        setRecoveryDialogOpen(true)
      }
    }
  }, [
    deleteRecovery,
    recovery,
    today,
    upsertRecovery,
    user?.id,
    validatedDates,
  ])

  const dismissRecoveryDialog = useCallback(() => {
    sessionStorage.setItem(recoveryDismissedStorageKey(today), '1')
    setRecoveryDialogOpen(false)
  }, [today])

  const validatedToday = validatedDates.has(today)

  const value = useMemo(
    (): NutritionStreakGamificationContextValue => ({
      displayStreak,
      isFrozen,
      recoveryProgress,
      validatedToday,
      isLoading: validatedQuery.isLoading || recoveryQuery.isLoading,
      error: (validatedQuery.error ?? recoveryQuery.error) as Error | null,
      validateTodayIfNeeded,
      reconcileOnDietPageOpen,
      dismissRecoveryDialog,
    }),
    [
      displayStreak,
      dismissRecoveryDialog,
      isFrozen,
      recoveryProgress,
      validatedToday,
      reconcileOnDietPageOpen,
      recoveryQuery.error,
      recoveryQuery.isLoading,
      validateTodayIfNeeded,
      validatedQuery.error,
      validatedQuery.isLoading,
    ],
  )

  return (
    <NutritionStreakGamificationContext.Provider value={value}>
      {children}

      <NutritionStreakCelebrationOverlay
        open={celebration !== null}
        streak={celebration?.streak ?? 0}
        milestoneMessage={celebration?.milestone?.message ?? null}
        onClose={() => setCelebration(null)}
      />

      <NutritionStreakRecoveryDialog
        open={recoveryDialogOpen}
        frozenStreak={recoveryDialogFrozenStreak}
        progress={recoveryProgress ?? 0}
        onOpenChange={(open) => {
          if (!open) {
            dismissRecoveryDialog()
          } else {
            setRecoveryDialogOpen(true)
          }
        }}
      />
    </NutritionStreakGamificationContext.Provider>
  )
}

export function useNutritionStreakGamification() {
  const context = useContext(NutritionStreakGamificationContext)

  if (!context) {
    throw new Error(
      'useNutritionStreakGamification must be used within NutritionStreakGamificationProvider',
    )
  }

  return context
}

export function useNutritionStreakGamificationActions() {
  const { validateTodayIfNeeded, reconcileOnDietPageOpen } =
    useNutritionStreakGamification()

  return { validateTodayIfNeeded, reconcileOnDietPageOpen }
}

export function useOptionalNutritionStreakGamificationActions() {
  const context = useContext(NutritionStreakGamificationContext)

  return context
    ? {
        validateTodayIfNeeded: context.validateTodayIfNeeded,
        reconcileOnDietPageOpen: context.reconcileOnDietPageOpen,
      }
    : null
}
