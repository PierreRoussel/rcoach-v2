import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  DELETE_PROGRAM_EXERCISE,
  GET_PROGRAM,
  INSERT_COACH_CLIENT,
  INSERT_PROGRAM,
  INSERT_PROGRAM_DAY,
  INSERT_PROGRAM_EXERCISE,
  LIST_CLIENT_WORKOUTS,
  LIST_MY_COACH_CLIENTS,
  LIST_MY_PROGRAMS,
  UPDATE_COACH_CLIENT_STATUS,
  UPDATE_PROGRAM,
  type ClientWorkout,
  type CoachClient,
  type Program,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export function useCoachClients() {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['coach', 'clients', userId],
    enabled: isAuthenticated && Boolean(userId),
    queryFn: async () => {
      const data = await graphqlRequest<{ coach_clients: CoachClient[] }>(
        nhost,
        LIST_MY_COACH_CLIENTS,
      )
      return data.coach_clients.filter(
        (client) => client.coach_id === nhost.getUserSession()?.user?.id,
      )
    },
  })
}

export function useInviteCoachClient() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitedEmail: string) => {
      const data = await graphqlRequest<{
        insert_coach_clients_one: CoachClient
      }>(nhost, INSERT_COACH_CLIENT, {
        object: {
          invited_email: invitedEmail.trim().toLowerCase(),
          status: 'pending',
        },
      })
      return data.insert_coach_clients_one
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coach', 'clients'] })
    },
  })
}

export function useUpdateCoachClientStatus() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'active' | 'archived'
    }) => {
      const data = await graphqlRequest<{
        update_coach_clients_by_pk: { id: string; status: string }
      }>(nhost, UPDATE_COACH_CLIENT_STATUS, { id, status })
      return data.update_coach_clients_by_pk
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coach', 'clients'] })
    },
  })
}

export function useCoachPrograms() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['coach', 'programs'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{ programs: Program[] }>(
        nhost,
        LIST_MY_PROGRAMS,
      )
      return data.programs
    },
  })
}

export function useProgram(programId: string) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['coach', 'programs', programId],
    enabled: isAuthenticated && Boolean(programId),
    queryFn: async () => {
      const data = await graphqlRequest<{ programs_by_pk: Program | null }>(
        nhost,
        GET_PROGRAM,
        { id: programId },
      )
      return data.programs_by_pk
    },
  })
}

export function useCreateProgram() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      isTemplate?: boolean
    }) => {
      const data = await graphqlRequest<{ insert_programs_one: Program }>(
        nhost,
        INSERT_PROGRAM,
        {
          object: {
            name: input.name,
            description: input.description ?? null,
            is_template: input.isTemplate ?? true,
          },
        },
      )
      return data.insert_programs_one
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coach', 'programs'] })
    },
  })
}

export function useUpdateProgram() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string
      changes: { name?: string; description?: string; is_template?: boolean }
    }) => {
      const data = await graphqlRequest<{ update_programs_by_pk: Program }>(
        nhost,
        UPDATE_PROGRAM,
        { id, changes },
      )
      return data.update_programs_by_pk
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['coach', 'programs'] })
      await queryClient.invalidateQueries({
        queryKey: ['coach', 'programs', variables.id],
      })
    },
  })
}

export function useAddProgramDay() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      programId,
      name,
      sortOrder,
    }: {
      programId: string
      name: string
      sortOrder: number
    }) => {
      const data = await graphqlRequest<{
        insert_program_days_one: { id: string; name: string }
      }>(nhost, INSERT_PROGRAM_DAY, {
        object: { program_id: programId, name, sort_order: sortOrder },
      })
      return data.insert_program_days_one
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['coach', 'programs', variables.programId],
      })
      await queryClient.invalidateQueries({ queryKey: ['coach', 'programs'] })
    },
  })
}

export function useAddProgramExercise() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      programId: _programId,
      programDayId,
      exerciseId,
      sortOrder,
      targetSets,
      targetReps,
    }: {
      programId: string
      programDayId: string
      exerciseId: string
      sortOrder: number
      targetSets?: number
      targetReps?: string
    }) => {
      const data = await graphqlRequest<{
        insert_program_exercises_one: { id: string }
      }>(nhost, INSERT_PROGRAM_EXERCISE, {
        object: {
          program_day_id: programDayId,
          exercise_id: exerciseId,
          sort_order: sortOrder,
          target_sets: targetSets ?? null,
          target_reps: targetReps ?? null,
        },
      })
      return data.insert_program_exercises_one
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['coach', 'programs', variables.programId],
      })
    },
  })
}

export function useRemoveProgramExercise() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      programId: _programId,
      programExerciseId,
    }: {
      programId: string
      programExerciseId: string
    }) => {
      await graphqlRequest(nhost, DELETE_PROGRAM_EXERCISE, {
        id: programExerciseId,
      })
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['coach', 'programs', variables.programId],
      })
    },
  })
}

export function useClientWorkouts(limit = 50) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['coach', 'client-workouts', limit],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{ workouts: ClientWorkout[] }>(
        nhost,
        LIST_CLIENT_WORKOUTS,
        { limit },
      )
      return data.workouts
    },
  })
}

export function computeWeeklyVolumeByClient(workouts: ClientWorkout[]) {
  const byClient = new Map<
    string,
    { name: string; volume: number; sessions: number }
  >()

  for (const workout of workouts) {
    const clientId = workout.user.id
    const existing = byClient.get(clientId) ?? {
      name: workout.user.display_name,
      volume: 0,
      sessions: 0,
    }

    let workoutVolume = 0
    for (const we of workout.workout_exercises) {
      for (const set of we.sets) {
        if (set.set_type === 'warmup') continue
        if (set.weight_kg != null && set.reps != null) {
          workoutVolume += set.weight_kg * set.reps
        }
      }
    }

    existing.volume += workoutVolume
    existing.sessions += 1
    byClient.set(clientId, existing)
  }

  return [...byClient.values()].sort((a, b) => b.volume - a.volume)
}
