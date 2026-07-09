import type { NhostClient } from '@nhost/nhost-js'

import { parseAdminRecentLists } from '@/lib/admin/recent-lists'
import { ADMIN_PLATFORM_RECENT_LISTS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

export async function fetchAdminRecentLists(nhost: NhostClient, limit = 25) {
  const data = await graphqlRequest<{
    admin_platform_recent_lists: { value: unknown }
  }>(nhost, ADMIN_PLATFORM_RECENT_LISTS, { limit })

  return parseAdminRecentLists(data.admin_platform_recent_lists.value)
}
