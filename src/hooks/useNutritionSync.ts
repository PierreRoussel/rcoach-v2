import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { flushSyncQueue } from '@/lib/graphql/sync-queue'
import { useAuth } from '@/lib/nhost/AuthProvider'

async function runNutritionSync(
  nhost: ReturnType<typeof useAuth>['nhost'],
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await flushSyncQueue(nhost)
  await queryClient.invalidateQueries({ queryKey: ['nutrition-day'] })
  await queryClient.invalidateQueries({ queryKey: ['nutrition-hints'] })
  await queryClient.invalidateQueries({ queryKey: ['nutrition-log-history'] })
  await queryClient.invalidateQueries({ queryKey: ['nutrition-sync-pending'] })
}

export function useNutritionSync() {
  const { nhost, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (!isAuthenticated || !isOnline) {
      return
    }

    void runNutritionSync(nhost, queryClient)
  }, [isAuthenticated, isOnline, nhost, queryClient])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const syncIfOnline = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return
      }

      void runNutritionSync(nhost, queryClient)
    }

    window.addEventListener('online', syncIfOnline)
    document.addEventListener('visibilitychange', syncIfOnline)

    return () => {
      window.removeEventListener('online', syncIfOnline)
      document.removeEventListener('visibilitychange', syncIfOnline)
    }
  }, [isAuthenticated, nhost, queryClient])
}

export { runNutritionSync }
