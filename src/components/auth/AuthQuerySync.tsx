import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { resetAuthenticatedProfileSession } from '@/lib/auth/guard-profile'
import { clearNutritionOfflineData } from '@/lib/nutrition/clear-nutrition-offline-data'
import { useAuth } from '@/lib/nhost/AuthProvider'

/**
 * Keeps React Query + router in sync when the auth identity changes
 * (login/logout in this tab or another tab via session sync).
 *
 * Watches `user.id` only — access-token refreshes must not wipe the cache.
 */
export function AuthQuerySync() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  const previousUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const userId = user?.id ?? null

    if (previousUserIdRef.current === undefined) {
      previousUserIdRef.current = userId
      return
    }

    if (previousUserIdRef.current === userId) {
      return
    }

    const previousUserId = previousUserIdRef.current
    previousUserIdRef.current = userId

    queryClient.clear()
    resetAuthenticatedProfileSession()

    // Drop offline nutrition only when leaving a logged-in identity (logout / user switch).
    if (previousUserId != null) {
      void clearNutritionOfflineData()
    }

    void router.invalidate()
  }, [queryClient, router, user?.id])

  return null
}
