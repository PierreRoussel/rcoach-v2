import type { NhostClient } from '@nhost/nhost-js'

import { requestAdminKpi } from '@/lib/admin/admin-kpi-api'
import { parseAdminSupportRequests } from '@/lib/admin/support-requests'
import { toAdminKpiAccessError } from '@/lib/graphql/admin-access-errors'

export async function fetchAdminSupportRequests(nhost: NhostClient, limit = 50) {
  try {
    const value = await requestAdminKpi<unknown>(nhost, {
      action: 'support_requests',
      limit,
    })

    return parseAdminSupportRequests(value)
  } catch (error) {
    throw toAdminKpiAccessError(error)
  }
}
