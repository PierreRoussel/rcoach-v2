import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { useAuth } from '@/lib/nhost/AuthProvider'

export function AuthQuerySync() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const previousUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const userId = user?.id

    if (
      previousUserIdRef.current !== undefined &&
      previousUserIdRef.current !== userId
    ) {
      queryClient.clear()
    }

    previousUserIdRef.current = userId
  }, [queryClient, user?.id])

  return null
}
