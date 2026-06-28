import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  INSERT_WAIST_ENTRY,
  LIST_WAIST_ENTRIES,
  type WaistEntry,
  type WaistEntryInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useWaistEntries() {
  const { nhost, isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ['waist-entries', user?.id],
    enabled: isAuthenticated && Boolean(user?.id),
    queryFn: async () => {
      const data = await graphqlRequest<{
        waist_entries: WaistEntry[]
      }>(nhost, LIST_WAIST_ENTRIES, { userId: user!.id })
      return data.waist_entries
    },
  })
}

export function useInsertWaistEntry() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: WaistEntryInput) => {
      const data = await graphqlRequest<{
        insert_waist_entries_one: WaistEntry
      }>(nhost, INSERT_WAIST_ENTRY, {
        object: input,
      })

      return data.insert_waist_entries_one
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['waist-entries'] })
    },
  })
}
