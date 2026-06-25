import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  INSERT_WEIGHT_ENTRY,
  LIST_WEIGHT_ENTRIES,
  type WeightEntry,
  type WeightEntryInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useWeightEntries() {
  const { nhost, isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['weight-entries', user?.id],
    enabled: isAuthenticated && Boolean(user?.id),
    queryFn: async () => {
      const data = await graphqlRequest<{
        weight_entries: WeightEntry[]
      }>(nhost, LIST_WEIGHT_ENTRIES, { userId: user!.id })
      return data.weight_entries
    },
  })
}

export function useInsertWeightEntry() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: WeightEntryInput) => {
      const data = await graphqlRequest<{
        insert_weight_entries_one: WeightEntry
      }>(nhost, INSERT_WEIGHT_ENTRY, {
        object: input,
      })

      return data.insert_weight_entries_one
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['weight-entries'] })
    },
  })
}
