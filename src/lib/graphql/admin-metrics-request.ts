import type { NhostClient } from '@nhost/nhost-js'

import { requestAdminKpi } from '@/lib/admin/admin-kpi-api'
import { parseAdminPlatformMetrics } from '@/lib/admin/platform-metrics'
import { toAdminKpiAccessError } from '@/lib/graphql/admin-access-errors'

export async function fetchAdminPlatformMetrics(
  nhost: NhostClient,
  input: { from: string; to: string; cohortWeeks: number },
) {
  try {
    const value = await requestAdminKpi<unknown>(nhost, {
      action: 'metrics',
      from: input.from,
      to: input.to,
      cohortWeeks: input.cohortWeeks,
    })

    return parseAdminPlatformMetrics(value)
  } catch (error) {
    throw toAdminKpiAccessError(error)
  }
}
