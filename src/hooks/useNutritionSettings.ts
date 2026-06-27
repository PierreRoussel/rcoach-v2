import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  GET_NUTRITION_SETTINGS,
  UPSERT_NUTRITION_SETTINGS,
  type NutritionSettingsInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import type { NutritionSettings } from '@/lib/nutrition/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function isGraphqlNutritionMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('nutrition_settings') &&
    error.message.includes('query_root')
  )
}

export function useNutritionSettings() {
  const { nhost, isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['nutrition-settings', user?.id],
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        nutrition_settings_by_pk: NutritionSettings | null
      }>(nhost, GET_NUTRITION_SETTINGS, { userId: user!.id })
      return data.nutrition_settings_by_pk
    },
  })
}

export function useUpsertNutritionSettings() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NutritionSettingsInput) => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté')
      }

      const data = await graphqlRequest<{
        insert_nutrition_settings_one: NutritionSettings
      }>(nhost, UPSERT_NUTRITION_SETTINGS, {
        object: input,
      })

      return data.insert_nutrition_settings_one
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['nutrition-settings'] })
    },
  })
}
