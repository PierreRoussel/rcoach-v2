import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchAuthUserLocale,
  updateAuthUserLocale,
} from '@/lib/auth/auth-user-locale'
import { DEFAULT_USER_LOCALE, type UserLocale } from '@/lib/i18n/user-locale'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useAuthUserLocale() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['auth-user', 'locale', userId],
    enabled: isAuthenticated && Boolean(userId),
    queryFn: () => fetchAuthUserLocale(nhost, userId!),
  })

  const mutation = useMutation({
    mutationFn: (locale: UserLocale) => updateAuthUserLocale(nhost, userId!, locale),
    onSuccess: (locale) => {
      queryClient.setQueryData(['auth-user', 'locale', userId], locale)
    },
  })

  return {
    locale: query.data ?? DEFAULT_USER_LOCALE,
    isLoading: query.isLoading,
    updateLocale: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  }
}
