import { useQuery } from '@tanstack/react-query'

import {
  resolveAdminMetricsDateRange,
  type AdminMetricsRange,
} from '@/lib/admin/metrics-range'
import { fetchAdminPlatformMetrics } from '@/lib/graphql/admin-metrics-request'
import { isAdminProfile } from '@/lib/profile/roles'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'

export function useAdminPlatformMetrics(range: AdminMetricsRange) {
  const { nhost, isAuthenticated, user } = useAuth()
  const { data: profile } = useMyProfile()
  const dateRange = resolveAdminMetricsDateRange(range)

  return useQuery({
    queryKey: ['admin-metrics', user?.id, range, dateRange.from, dateRange.to],
    enabled: isAuthenticated && Boolean(user?.id) && isAdminProfile(profile),
    queryFn: () => fetchAdminPlatformMetrics(nhost, dateRange),
  })
}
