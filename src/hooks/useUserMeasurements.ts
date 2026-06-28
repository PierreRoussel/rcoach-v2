import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  GET_USER_MEASUREMENTS,
  UPSERT_USER_MEASUREMENTS,
  type UserMeasurementsInput as GraphqlUserMeasurementsInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { resolveUserMeasurements } from '@/lib/measurements/resolve-user-measurements'
import type { StoredUserMeasurements, UserMeasurements } from '@/lib/measurements/types'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useUserMeasurements() {
  const { nhost, isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['user-measurements', user?.id],
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const data = await graphqlRequest<{
        user_measurements_by_pk: UserMeasurements | null
      }>(nhost, GET_USER_MEASUREMENTS, { userId: user!.id })
      return data.user_measurements_by_pk
    },
  })
}

export function useUpsertUserMeasurements() {
  const { nhost, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: GraphqlUserMeasurementsInput) => {
      if (!user?.id) {
        throw new Error('Utilisateur non connecté')
      }

      const data = await graphqlRequest<{
        insert_user_measurements_one: UserMeasurements
      }>(nhost, UPSERT_USER_MEASUREMENTS, {
        object: input,
      })

      return data.insert_user_measurements_one
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-measurements'] })
    },
  })
}

export function useResolvedUserMeasurements(): {
  data: StoredUserMeasurements | null
  raw: UserMeasurements | null | undefined
  isLoading: boolean
} {
  const measurementsQuery = useUserMeasurements()

  const data = useMemo(
    () => resolveUserMeasurements(measurementsQuery.data),
    [measurementsQuery.data],
  )

  return {
    data,
    raw: measurementsQuery.data,
    isLoading: measurementsQuery.isLoading,
  }
}
