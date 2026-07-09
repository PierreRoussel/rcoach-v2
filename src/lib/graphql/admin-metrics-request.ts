import type { NhostClient } from '@nhost/nhost-js'

import { parseAdminPlatformMetrics } from '@/lib/admin/platform-metrics'
import { ADMIN_PLATFORM_METRICS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { isGraphqlDatabaseError } from '@/lib/graphql/schema-errors'

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
      admin_platform_metrics: { value: unknown }
    }>(nhost, ADMIN_PLATFORM_METRICS, {
      from: input.from,
      to: input.to,
      cohortWeeks: input.cohortWeeks,
    })

    return parseAdminPlatformMetrics(data.admin_platform_metrics.value)
  } catch (error) {
    if (isAdminPlatformMetricsMissingError(error)) {
      throw new Error(
        'Le backend admin n’est pas déployé ou les métadonnées Hasura sont incohérentes. Déployez nhost/ (migration 1744400000000_hasura_trackable_functions) puis relancez le workflow « Deploy Nhost ».',
      )
    }

    if (error instanceof Error && error.message.toLowerCase().includes('forbidden')) {
      throw new Error(
        'Accès refusé : votre compte doit avoir le rôle admin (scripts/admin-promote-leo.sql).',
      )
    }

    if (isGraphqlDatabaseError(error)) {
      throw new Error(
        `${error.message} — Déployez la migration 1744500000000_fix_admin_kpi_functions (fonctions admin KPI).`,
      )
    }

    throw error
  }
}
