import { useQuery } from '@tanstack/react-query'
import type { NhostClient } from '@nhost/nhost-js'

import {
  FALLBACK_BADGE_CATALOG,
  mapBadgeRecordToDefinition,
  type BadgeDefinition,
  type BadgeDefinitionRecord,
} from '@/lib/gamification/badges'
import { LIST_ACTIVE_BADGE_DEFINITIONS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const BADGE_CATALOG_QUERY_KEY = ['badge-definitions', 'active']

export async function fetchActiveBadgeCatalog(
  nhost: NhostClient,
): Promise<BadgeDefinitionRecord[]> {
  try {
    const data = await graphqlRequest<{ badge_definitions: BadgeDefinitionRecord[] }>(
      nhost,
      LIST_ACTIVE_BADGE_DEFINITIONS,
    )
    return data.badge_definitions
  } catch {
    return FALLBACK_BADGE_CATALOG
  }
}

export function useBadgeCatalog() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: BADGE_CATALOG_QUERY_KEY,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
    queryFn: () => fetchActiveBadgeCatalog(nhost),
    placeholderData: FALLBACK_BADGE_CATALOG,
  })
}

export function useBadgeDefinitions(): BadgeDefinition[] {
  const { data = FALLBACK_BADGE_CATALOG } = useBadgeCatalog()
  return data.map(mapBadgeRecordToDefinition)
}

export function getBadgeDefinitionFromHookCatalog(
  key: string,
  catalog: BadgeDefinitionRecord[],
): BadgeDefinition | undefined {
  const record = catalog.find((badge) => badge.key === key)
  return record ? mapBadgeRecordToDefinition(record) : undefined
}
