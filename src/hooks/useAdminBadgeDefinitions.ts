import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { BADGE_CATALOG_QUERY_KEY } from '@/hooks/useBadgeCatalog'
import type { BadgeDefinitionRecord } from '@/lib/gamification/badges'
import {
  DELETE_BADGE_DEFINITION,
  INSERT_BADGE_DEFINITION,
  LIST_ALL_BADGE_DEFINITIONS,
  UPDATE_BADGE_DEFINITION,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'
import { isAdminProfile } from '@/lib/profile/roles'

const ADMIN_BADGES_KEY = ['admin', 'badge-definitions']

export type BadgeDefinitionInput = {
  key: string
  label: string
  description: string
  category: BadgeDefinitionRecord['category']
  tier: BadgeDefinitionRecord['tier']
  icon_name: string
  rule_type: BadgeDefinitionRecord['rule_type']
  rule_threshold: number | null
  is_active: boolean
  sort_order: number
}

export function useAdminBadgeDefinitions(enabled = true) {
  const { nhost, isAuthenticated } = useAuth()
  const { data: profile } = useMyProfile()
  const isAdmin = isAdminProfile(profile)

  return useQuery({
    queryKey: ADMIN_BADGES_KEY,
    enabled: enabled && isAuthenticated && isAdmin,
    queryFn: async () => {
      const data = await graphqlRequest<{ badge_definitions: BadgeDefinitionRecord[] }>(
        nhost,
        LIST_ALL_BADGE_DEFINITIONS,
      )
      return data.badge_definitions
    },
  })
}

export function useCreateBadgeDefinition() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: BadgeDefinitionInput) => {
      const data = await graphqlRequest<{
        insert_badge_definitions_one: BadgeDefinitionRecord
      }>(nhost, INSERT_BADGE_DEFINITION, {
        object: {
          ...input,
          updated_at: new Date().toISOString(),
        },
      })

      return data.insert_badge_definitions_one
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_BADGES_KEY }),
        queryClient.invalidateQueries({ queryKey: BADGE_CATALOG_QUERY_KEY }),
      ])
    },
  })
}

export function useUpdateBadgeDefinition() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      key,
      changes,
    }: {
      key: string
      changes: Partial<BadgeDefinitionInput>
    }) => {
      const data = await graphqlRequest<{
        update_badge_definitions_by_pk: BadgeDefinitionRecord
      }>(nhost, UPDATE_BADGE_DEFINITION, {
        key,
        changes: {
          ...changes,
          updated_at: new Date().toISOString(),
        },
      })

      return data.update_badge_definitions_by_pk
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_BADGES_KEY }),
        queryClient.invalidateQueries({ queryKey: BADGE_CATALOG_QUERY_KEY }),
      ])
    },
  })
}

export function useDeleteBadgeDefinition() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (key: string) => {
      const data = await graphqlRequest<{
        delete_badge_definitions_by_pk: { key: string } | null
      }>(nhost, DELETE_BADGE_DEFINITION, { key })

      return data.delete_badge_definitions_by_pk
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_BADGES_KEY }),
        queryClient.invalidateQueries({ queryKey: BADGE_CATALOG_QUERY_KEY }),
      ])
    },
  })
}
