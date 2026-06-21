import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  GET_MY_PROFILE,
  LIST_PUBLIC_EXERCISES,
  UPDATE_MY_PROFILE,
  type Exercise,
  type Profile,
  type ProfileUpdateInput,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useMyProfile() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['profile', 'me'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{ profiles: Profile[] }>(
        nhost,
        GET_MY_PROFILE,
      )

      return data.profiles[0] ?? null
    },
  })
}

export function useUpdateProfile() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      changes,
    }: {
      profileId: string
      changes: ProfileUpdateInput
    }) => {
      const data = await graphqlRequest<{ update_profiles_by_pk: Profile | null }>(
        nhost,
        UPDATE_MY_PROFILE,
        { id: profileId, changes },
      )

      return data.update_profiles_by_pk
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    },
  })
}

export function usePublicExercises() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['exercises', 'public'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{ exercises: Exercise[] }>(
        nhost,
        LIST_PUBLIC_EXERCISES,
      )

      return data.exercises
    },
  })
}
