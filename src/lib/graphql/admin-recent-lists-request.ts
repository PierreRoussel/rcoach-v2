import type { NhostClient } from '@nhost/nhost-js'

import { toAdminKpiAccessError } from '@/lib/graphql/admin-access-errors'
import { parseAdminRecentLists } from '@/lib/admin/recent-lists'
import { ADMIN_PLATFORM_RECENT_LISTS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

export async function fetchAdminRecentLists(nhost: NhostClient, limit = 25) {
  try {
    const data = await graphqlRequest<{
      admin_platform_recent_lists: { value: unknown }
    }>(nhost, ADMIN_PLATFORM_RECENT_LISTS, { limit })

    return parseAdminRecentLists(data.admin_platform_recent_lists.value)
  } catch (error) {
    throw toAdminKpiAccessError(error)
  }
}
