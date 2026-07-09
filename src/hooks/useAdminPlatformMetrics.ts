import { useQuery } from '@tanstack/react-query'

import {
  resolveAdminMetricsDateRange,
  type AdminMetricsRange,
} from '@/lib/admin/metrics-range'
import { fetchAdminPlatformMetrics } from '@/lib/graphql/admin-metrics-request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useAdminPlatformMetrics(range: AdminMetricsRange) {
  const { nhost, isAuthenticated, user } = useAuth()
  const dateRange = resolveAdminMetricsDateRange(range)

  return useQuery({
    queryKey: ['admin-metrics', range, dateRange.from, dateRange.to],
    enabled: isAuthenticated && Boolean(user?.id),
    queryFn: () => fetchAdminPlatformMetrics(nhost, dateRange),
  })
}
