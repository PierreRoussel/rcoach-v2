import { useQuery } from '@tanstack/react-query'

import {
  GET_MY_PROFILE,
  LIST_PUBLIC_EXERCISES,
  type Exercise,
  type Profile,
} from '@/lib/graphql/operations'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useMyProfile() {
  const { nhost, user, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: isAuthenticated && Boolean(user?.id),
    queryFn: async () => {
      const response = await nhost.graphql.request<{
        profiles: Profile[]
      }>({
        query: GET_MY_PROFILE,
        variables: { userId: user!.id },
      })

      if (response.body.errors?.length) {
        throw new Error(response.body.errors[0]?.message ?? 'Profile query failed')
      }

      return response.body.data?.profiles[0] ?? null
    },
  })
}

export function usePublicExercises() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercises', 'public'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await nhost.graphql.request<{
        exercises: Exercise[]
      }>({
        query: LIST_PUBLIC_EXERCISES,
      })

      if (response.body.errors?.length) {
        throw new Error(
          response.body.errors[0]?.message ?? 'Exercises query failed',
        )
      }

      return response.body.data?.exercises ?? []
    },
  })
}
