import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  DELETE_SCHEDULED_SESSION,
  INSERT_SCHEDULED_SESSION,
  LIST_ALL_MY_SCHEDULED_SESSIONS,
  LIST_MY_SCHEDULED_SESSIONS,
  UPDATE_SCHEDULED_SESSION,
  type ScheduledSessionInput,
  type ScheduledSessionRecord,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import {
  isGraphqlScheduleMissingError,
  stripNullishFields,
  toScheduleDeployError,
} from '@/lib/graphql/schema-errors'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { getTodayReminders } from '@/lib/schedule/today-reminders'
import { useMyLastCompletedWorkout } from '@/hooks/useWorkouts'

export {
  isGraphqlScheduleMissingError,
  SCHEDULE_NOT_DEPLOYED_MESSAGE,
} from '@/lib/graphql/schema-errors'

export type ScheduledSessionsResult = {
  sessions: ScheduledSessionRecord[]
  deployed: boolean
}

export function useScheduledSessions(options?: { includeInactive?: boolean }) {
  const { nhost, isAuthenticated } = useAuth()
  const includeInactive = options?.includeInactive ?? false

  return useQuery({
    queryKey: ['scheduled-sessions', includeInactive ? 'all' : 'active'],
    enabled: isAuthenticated,
    staleTime: 2 * 60_000,
    queryFn: async (): Promise<ScheduledSessionsResult> => {
      try {
        const query = includeInactive
          ? LIST_ALL_MY_SCHEDULED_SESSIONS
          : LIST_MY_SCHEDULED_SESSIONS
        const data = await graphqlRequest<{
          scheduled_sessions: ScheduledSessionRecord[]
        }>(nhost, query)

        return {
          sessions: data.scheduled_sessions,
          deployed: true,
        }
      } catch (error) {
        if (isGraphqlScheduleMissingError(error)) {
          return {
            sessions: [],
            deployed: false,
          }
        }

        throw error
      }
    },
  })
}

export function useCreateScheduledSession() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ScheduledSessionInput) => {
      try {
        const data = await graphqlRequest<{
          insert_scheduled_sessions_one: ScheduledSessionRecord
        }>(nhost, INSERT_SCHEDULED_SESSION, {
          object: stripNullishFields(
            {
              ...input,
              is_active: input.is_active ?? true,
            },
            ['workout_template_id', 'workout_template_id_b', 'weekdays', 'scheduled_date', 'time_local', 'end_date'],
          ),
        })

        return data.insert_scheduled_sessions_one
      } catch (error) {
        throw toScheduleDeployError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduled-sessions'] })
      await queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useUpdateScheduledSession() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: string
      changes: Partial<ScheduledSessionInput>
    }) => {
      try {
        const data = await graphqlRequest<{
          update_scheduled_sessions_by_pk: ScheduledSessionRecord
        }>(nhost, UPDATE_SCHEDULED_SESSION, {
          id,
          changes: {
            ...changes,
            updated_at: new Date().toISOString(),
          },
        })

        return data.update_scheduled_sessions_by_pk
      } catch (error) {
        throw toScheduleDeployError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduled-sessions'] })
      await queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useDeleteScheduledSession() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await graphqlRequest(nhost, DELETE_SCHEDULED_SESSION, { id })
      } catch (error) {
        throw toScheduleDeployError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduled-sessions'] })
      await queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useTodayReminders(now = new Date()) {
  const { data: sessionsResult, isLoading: sessionsLoading } = useScheduledSessions()
  const { data: lastCompletedWorkout, isLoading: workoutLoading } =
    useMyLastCompletedWorkout()

  const todayReminders = useMemo(
    () =>
      getTodayReminders(
        sessionsResult?.sessions ?? [],
        now,
        lastCompletedWorkout ? [lastCompletedWorkout] : [],
      ),
    [sessionsResult?.sessions, now, lastCompletedWorkout],
  )

  return {
    todayReminders,
    isLoading: sessionsLoading || workoutLoading,
    scheduleAvailable: sessionsResult?.deployed ?? true,
  }
}
