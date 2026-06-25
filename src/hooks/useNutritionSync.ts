import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { flushSyncQueue } from '@/lib/graphql/sync-queue'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useNutritionSync() {
  const { nhost, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (!isAuthenticated || !isOnline) {
      return
    }

    void (async () => {
      await flushSyncQueue(nhost)
      await queryClient.invalidateQueries({ queryKey: ['nutrition-day'] })
      await queryClient.invalidateQueries({ queryKey: ['nutrition-log-history'] })
      await queryClient.invalidateQueries({ queryKey: ['nutrition-sync-pending'] })
      await queryClient.invalidateQueries({ queryKey: ['nutrition-streak'] })
    })()
  }, [isAuthenticated, isOnline, nhost, queryClient])
}
