import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  LIST_PUBLIC_EXERCISES,
  type Exercise,
  type ProfileUpdateInput,
} from '@/lib/graphql/operations'
import { fetchMyProfile, updateMyProfile } from '@/lib/graphql/profile-request'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useMyProfile() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['profile', 'me'],
    enabled: isAuthenticated,
    queryFn: () => fetchMyProfile(nhost),
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
    }) => updateMyProfile(nhost, profileId, changes),
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
