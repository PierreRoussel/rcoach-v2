import type { NhostClient } from '@nhost/nhost-js'

import { parseAdminSupportRequests } from '@/lib/admin/support-requests'
import { toAdminKpiAccessError } from '@/lib/graphql/admin-access-errors'
import { ADMIN_SUPPORT_REQUESTS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

export async function fetchAdminSupportRequests(nhost: NhostClient, limit = 50) {
  try {
    const data = await graphqlRequest<{
      admin_support_requests: { value: unknown }
    }>(nhost, ADMIN_SUPPORT_REQUESTS, { limit })

    return parseAdminSupportRequests(data.admin_support_requests.value)
  } catch (error) {
    throw toAdminKpiAccessError(error)
  }
}
