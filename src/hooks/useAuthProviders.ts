import { useQuery } from '@tanstack/react-query'

import { GET_MY_AUTH_PROVIDERS } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

const EMAIL_PASSWORD_PROVIDER_ID = 'email'

export function useMyAuthProviders() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['auth-providers'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{
        authUserProviders: Array<{ providerId: string }>
      }>(nhost, GET_MY_AUTH_PROVIDERS)

      return data.authUserProviders.map((provider) => provider.providerId)
    },
    staleTime: 60_000,
  })
}

export function isGoogleOnlyAccount(providerIds: string[] | undefined) {
  if (!providerIds || providerIds.length === 0) {
    return false
  }

  return providerIds.every((providerId) => providerId === 'google')
}

export function hasEmailPasswordAccount(providerIds: string[] | undefined) {
  return providerIds?.includes(EMAIL_PASSWORD_PROVIDER_ID) ?? false
}
