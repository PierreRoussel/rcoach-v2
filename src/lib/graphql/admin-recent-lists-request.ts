import type { NhostClient } from '@nhost/nhost-js'

import { requestAdminKpi } from '@/lib/admin/admin-kpi-api'
import { parseAdminRecentLists } from '@/lib/admin/recent-lists'
import { toAdminKpiAccessError } from '@/lib/graphql/admin-access-errors'

export async function fetchAdminRecentLists(nhost: NhostClient, limit = 25) {
  try {
    const value = await requestAdminKpi<unknown>(nhost, {
      action: 'recent_lists',
      limit,
    })

    return parseAdminRecentLists(value)
  } catch (error) {
    throw toAdminKpiAccessError(error)
  }
}
