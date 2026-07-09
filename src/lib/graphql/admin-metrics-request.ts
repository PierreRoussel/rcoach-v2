import type { NhostClient } from '@nhost/nhost-js'

import { parseAdminPlatformMetrics } from '@/lib/admin/platform-metrics'
import { ADMIN_PLATFORM_METRICS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

export async function fetchAdminPlatformMetrics(
  nhost: NhostClient,
  input: { from: string; to: string; cohortWeeks: number },
) {
  const data = await graphqlRequest<{
    admin_platform_metrics: unknown
  }>(nhost, ADMIN_PLATFORM_METRICS, {
    from: input.from,
    to: input.to,
    cohortWeeks: input.cohortWeeks,
  })

  return parseAdminPlatformMetrics(data.admin_platform_metrics)
}
