import type { NhostClient } from '@nhost/nhost-js'

import { parseAdminPlatformMetrics } from '@/lib/admin/platform-metrics'
import { ADMIN_PLATFORM_METRICS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

function isAdminPlatformMetricsMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('admin_platform_metrics') &&
    message.includes('not found') &&
    message.includes('query_root')
  )
}

export async function fetchAdminPlatformMetrics(
  nhost: NhostClient,
  input: { from: string; to: string; cohortWeeks: number },
) {
  try {
    const data = await graphqlRequest<{
      admin_platform_metrics: unknown
    }>(nhost, ADMIN_PLATFORM_METRICS, {
      from: input.from,
      to: input.to,
      cohortWeeks: input.cohortWeeks,
    })

    return parseAdminPlatformMetrics(data.admin_platform_metrics)
  } catch (error) {
    if (isAdminPlatformMetricsMissingError(error)) {
      throw new Error(
        'Le backend admin n’est pas déployé. Poussez les changements nhost/ sur main et lancez le workflow « Deploy Nhost » (migration 1743910000000_admin_platform_kpis).',
      )
    }

    throw error
  }
}
