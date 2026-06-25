import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import {
  DEFAULT_GLOBAL_REST_SECONDS,
  templateToDraft,
} from '@/hooks/useWorkoutTemplates'
import { GET_WORKOUT_TEMPLATE } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import type { ScheduleOccurrence } from '@/lib/schedule/expand-occurrences'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { templateExercisesToActive } from '@/lib/workout/template-mapper'

export function useStartPlannedSession() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const startWorkout = useActiveWorkoutStore((state) => state.startWorkout)
  const startWorkoutFromTemplate = useActiveWorkoutStore(
    (state) => state.startWorkoutFromTemplate,
  )
  const [isStarting, setIsStarting] = useState(false)

  async function startPlannedSession(occurrence: ScheduleOccurrence) {
    setIsStarting(true)

    try {
      if (!occurrence.workoutTemplateId) {
        await startWorkout(
          occurrence.title || occurrence.workoutTemplateName || 'Séance planifiée',
        )
        await navigate({ to: '/app/workout/active' })
        return
      }

      const data = await graphqlRequest<{
        workout_templates_by_pk: Parameters<typeof templateToDraft>[0] | null
      }>(nhost, GET_WORKOUT_TEMPLATE, { id: occurrence.workoutTemplateId })

      const template = data.workout_templates_by_pk

      if (!template) {
        await startWorkout(
          occurrence.title || occurrence.workoutTemplateName || 'Séance planifiée',
        )
        await navigate({ to: '/app/workout/active' })
        return
      }

      const draft = templateToDraft(template)
      await startWorkoutFromTemplate(
        occurrence.title ||
          occurrence.workoutTemplateName ||
          template.name ||
          'Séance planifiée',
        templateExercisesToActive(draft.exercises),
        DEFAULT_GLOBAL_REST_SECONDS,
        occurrence.workoutTemplateId,
      )
      await navigate({ to: '/app/workout/active' })
    } finally {
      setIsStarting(false)
    }
  }

  return { startPlannedSession, isStarting }
}
