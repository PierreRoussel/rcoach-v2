import { useQuery } from '@tanstack/react-query'

import { fetchAdminRecentLists } from '@/lib/graphql/admin-recent-lists-request'
import { isAdminProfile } from '@/lib/profile/roles'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useMyProfile } from '@/hooks/useProfile'

export function useAdminRecentLists(limit = 25) {
  const { nhost, isAuthenticated, user } = useAuth()
  const { data: profile } = useMyProfile()

  return useQuery({
    queryKey: ['admin-recent-lists', user?.id, limit],
    enabled: isAuthenticated && Boolean(user?.id) && isAdminProfile(profile),
    queryFn: () => fetchAdminRecentLists(nhost, limit),
  })
}
