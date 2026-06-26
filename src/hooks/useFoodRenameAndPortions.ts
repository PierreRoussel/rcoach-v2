import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  INSERT_FOOD_PORTION_TYPE,
  INSERT_FOOD_RENAME_PROPOSAL,
  LIST_FOOD_PORTION_TYPES,
  LIST_PENDING_FOOD_RENAME_PROPOSALS,
  REVIEW_FOOD_RENAME_PROPOSAL,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export type FoodRenameProposal = {
  id: string
  proposed_name: string
  created_at: string
  food: {
    id: string
    name: string
    brand: string | null
    source: string
  }
  proposer: {
    id: string
    display_name: string | null
  } | null
}

export type FoodPortionType = {
  id: string
  portion_name: string
  portion_size_g: number
  created_at: string
}

export function useFoodPortionTypes(foodId: string | null, enabled = true) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['food-portion-types', foodId],
    enabled: isAuthenticated && Boolean(foodId) && enabled,
    queryFn: async () => {
      const data = await graphqlRequest<{ food_portion_types: FoodPortionType[] }>(
        nhost,
        LIST_FOOD_PORTION_TYPES,
        { foodId },
      )
      return data.food_portion_types
    },
  })
}

export function useFoodRenameAndPortionMutations() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  const proposeRename = useMutation({
    mutationFn: async (input: { foodId: string; proposedName: string }) => {
      const data = await graphqlRequest<{
        insert_food_rename_proposals_one: { id: string }
      }>(nhost, INSERT_FOOD_RENAME_PROPOSAL, {
        foodId: input.foodId,
        proposedName: input.proposedName,
      })
      return data.insert_food_rename_proposals_one
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['food-rename-proposals'] })
    },
  })

  const addPortionType = useMutation({
    mutationFn: async (input: {
      foodId: string
      portionName: string
      portionSizeG: number
    }) => {
      const data = await graphqlRequest<{
        insert_food_portion_types_one: FoodPortionType
      }>(nhost, INSERT_FOOD_PORTION_TYPE, {
        foodId: input.foodId,
        portionName: input.portionName,
        portionSizeG: input.portionSizeG,
      })
      return data.insert_food_portion_types_one
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['food-portion-types', variables.foodId],
      })
    },
  })

  return { proposeRename, addPortionType }
}

export function usePendingFoodRenameProposals(enabled = true) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['food-rename-proposals', 'pending'],
    enabled: isAuthenticated && enabled,
    queryFn: async () => {
      const data = await graphqlRequest<{
        food_rename_proposals: FoodRenameProposal[]
      }>(nhost, LIST_PENDING_FOOD_RENAME_PROPOSALS)
      return data.food_rename_proposals
    },
  })
}

export function useReviewFoodRenameProposal() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: 'approved' | 'rejected' }) => {
      const data = await graphqlRequest<{
        update_food_rename_proposals_by_pk: {
          id: string
          status: string
          food: { id: string; name: string }
        }
      }>(nhost, REVIEW_FOOD_RENAME_PROPOSAL, {
        id: input.id,
        status: input.status,
      })
      return data.update_food_rename_proposals_by_pk
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['food-rename-proposals'] })
      await queryClient.invalidateQueries({ queryKey: ['food-search-db'] })
      await queryClient.invalidateQueries({ queryKey: ['meal-log'] })
    },
  })
}
