import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  INSERT_WEIGHT_ENTRY,
  LIST_WEIGHT_ENTRIES,
  type WeightEntry,
  type WeightEntryInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { triggerWeightGoalProjectionSync } from '@/lib/goals/trigger-weight-goal-projection-sync'
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
  const { nhost, user } = useAuth()
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
    onSuccess: async (entry) => {
      if (user?.id) {
        queryClient.setQueryData<WeightEntry[]>(
          ['weight-entries', user.id],
          (previous) => {
            const next = previous ? [entry, ...previous] : [entry]
            return next.sort(
              (left, right) =>
                new Date(right.logged_at).getTime() -
                new Date(left.logged_at).getTime(),
            )
          },
        )
      }

      void queryClient.invalidateQueries({ queryKey: ['weight-entries'] })

      if (user?.id) {
        try {
          await triggerWeightGoalProjectionSync(
            nhost,
            queryClient,
            user.id,
            'weight_logged',
          )
        } catch {
          // Projection sync is best-effort after a weigh-in.
        }
      }
    },
  })
}
