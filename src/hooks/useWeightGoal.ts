import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  DELETE_WEIGHT_GOAL,
  GET_WEIGHT_GOAL,
  UPDATE_WEIGHT_GOAL,
  UPSERT_WEIGHT_GOAL,
  type WeightGoalInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import type { WeightGoal, WeightGoalRecord } from '@/lib/goals/weight-goal'
import {
  getLatestWeightKg,
  resolveWeightGoal,
} from '@/lib/measurements/current-weight'
import { useAuth } from '@/lib/nhost/AuthProvider'

import { useWeightEntries } from './useWeightEntries'

export function useWeightGoal() {
  const { nhost, isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['weight-goal', user?.id],
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        weight_goals_by_pk: WeightGoalRecord | null
      }>(nhost, GET_WEIGHT_GOAL, { userId: user!.id })
      return data.weight_goals_by_pk
    },
  })
}

export function useResolvedWeightGoal() {
  const goalQuery = useWeightGoal()
  const entriesQuery = useWeightEntries()

  const data = useMemo(
    () => resolveWeightGoal(goalQuery.data, entriesQuery.data),
    [goalQuery.data, entriesQuery.data],
  )

  return {
    ...goalQuery,
    data,
    isLoading: goalQuery.isLoading || entriesQuery.isLoading,
  }
}

export function useCurrentWeightKg() {
  const entriesQuery = useWeightEntries()

  return useMemo(
    () => getLatestWeightKg(entriesQuery.data),
    [entriesQuery.data],
  )
}

export function useUpsertWeightGoal() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: WeightGoalInput) => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté')
      }

      const data = await graphqlRequest<{
        insert_weight_goals_one: WeightGoalRecord
      }>(nhost, UPSERT_WEIGHT_GOAL, {
        object: input,
      })

      return data.insert_weight_goals_one
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-goal'] })
    },
  })
}

export function useUpdateWeightGoal() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      changes: Partial<WeightGoalInput> & {
        last_milestone_step?: number
      },
    ) => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté')
      }

      const data = await graphqlRequest<{
        update_weight_goals_by_pk: WeightGoalRecord
      }>(nhost, UPDATE_WEIGHT_GOAL, {
        userId: user.id,
        changes: {
          ...changes,
          updated_at: new Date().toISOString(),
        },
      })

      return data.update_weight_goals_by_pk
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-goal'] })
    },
  })
}

export function useDeleteWeightGoal() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté')
      }

      await graphqlRequest(nhost, DELETE_WEIGHT_GOAL, { userId: user.id })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-goal'] })
    },
  })
}

export type { WeightGoal, WeightGoalRecord }
