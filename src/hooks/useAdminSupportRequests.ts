import { useQuery } from '@tanstack/react-query'

import { fetchAdminSupportRequests } from '@/lib/graphql/admin-support-requests-request'
import { isAdminProfile } from '@/lib/profile/roles'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'

export function useAdminSupportRequests(limit = 50) {
  const { nhost, isAuthenticated, user } = useAuth()
  const { data: profile } = useMyProfile()

  return useQuery({
    queryKey: ['admin-support-requests', user?.id, limit],
    enabled: isAuthenticated && Boolean(user?.id) && isAdminProfile(profile),
    queryFn: () => fetchAdminSupportRequests(nhost, limit),
  })
}
