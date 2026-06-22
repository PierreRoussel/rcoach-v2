import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  DELETE_WORKOUT_TEMPLATE,
  DELETE_WORKOUT_TEMPLATE_EXERCISES,
  GET_WORKOUT_TEMPLATE,
  INSERT_WORKOUT_TEMPLATE,
  LIST_MY_WORKOUT_TEMPLATES,
  UPDATE_WORKOUT_TEMPLATE,
  type Exercise,
  type WorkoutTemplate,
} from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { insertTemplateExercises } from '@/lib/workout/insert-template-exercises'
import { useAuth } from '@/lib/nhost/AuthProvider'

export type TemplateSetDraft = {
  setIndex: number
  weightKg: number | null
  reps: number | null
  restSeconds: number
  usesGlobalRest: boolean
}

export type TemplateExerciseDraft = {
  exerciseId: string
  exerciseName: string
  muscleGroup: string | null
  equipment: string | null
  supersetId: number | null
  sets: TemplateSetDraft[]
}

export const DEFAULT_GLOBAL_REST_SECONDS = 90

export function isGraphqlTemplatesMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes("workout_templates") &&
    error.message.includes('query_root')
  )
}

export function useWorkoutTemplates() {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['workout-templates'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await graphqlRequest<{
        workout_templates: WorkoutTemplate[]
      }>(nhost, LIST_MY_WORKOUT_TEMPLATES)
      return data.workout_templates
    },
  })
}

export function useWorkoutTemplate(templateId: string) {
  const { nhost, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['workout-templates', templateId],
    enabled: isAuthenticated && Boolean(templateId),
    queryFn: async () => {
      const data = await graphqlRequest<{
        workout_templates_by_pk: WorkoutTemplate | null
      }>(nhost, GET_WORKOUT_TEMPLATE, { id: templateId })
      return data.workout_templates_by_pk
    },
  })
}

export function templateToDraft(
  template: WorkoutTemplate,
): { defaultRestSeconds: number; exercises: TemplateExerciseDraft[] } {
  const defaultRestSeconds =
    template.default_rest_seconds ?? DEFAULT_GLOBAL_REST_SECONDS

  return {
    defaultRestSeconds,
    exercises: template.workout_template_exercises.map((entry) => ({
      exerciseId: entry.exercise.id,
      exerciseName: entry.exercise.name,
      muscleGroup: entry.exercise.muscle_group,
      equipment: entry.exercise.equipment,
      supersetId: entry.superset_id ?? null,
      sets: (entry.workout_template_sets ?? []).map((set) => ({
        setIndex: set.set_index,
        weightKg: set.weight_kg,
        reps: set.reps,
        restSeconds: set.rest_seconds,
        usesGlobalRest: set.rest_seconds === defaultRestSeconds,
      })),
    })),
  }
}

export function useCreateWorkoutTemplate() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      defaultRestSeconds = DEFAULT_GLOBAL_REST_SECONDS,
      exercises = [],
    }: {
      name: string
      defaultRestSeconds?: number
      exercises?: TemplateExerciseDraft[]
    }) => {
      const data = await graphqlRequest<{
        insert_workout_templates_one: WorkoutTemplate
      }>(nhost, INSERT_WORKOUT_TEMPLATE, {
        object: {
          name,
          default_rest_seconds: defaultRestSeconds,
        },
      })

      const template = data.insert_workout_templates_one

      if (exercises.length > 0) {
        await insertTemplateExercises(
          nhost,
          template.id,
          exercises,
          defaultRestSeconds,
        )
      }

      return template
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
    },
  })
}

export function useCreateEmptyWorkoutTemplate() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const data = await graphqlRequest<{
        insert_workout_templates_one: WorkoutTemplate
      }>(nhost, INSERT_WORKOUT_TEMPLATE, {
        object: { name },
      })
      return data.insert_workout_templates_one
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
    },
  })
}

export function useSaveWorkoutTemplate() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      name,
      defaultRestSeconds,
      exercises,
    }: {
      templateId: string
      name: string
      defaultRestSeconds: number
      exercises: TemplateExerciseDraft[]
    }) => {
      await graphqlRequest(nhost, UPDATE_WORKOUT_TEMPLATE, {
        id: templateId,
        name,
        defaultRestSeconds,
      })
      await graphqlRequest(nhost, DELETE_WORKOUT_TEMPLATE_EXERCISES, {
        templateId,
      })
      if (exercises.length > 0) {
        await insertTemplateExercises(
          nhost,
          templateId,
          exercises,
          defaultRestSeconds,
        )
      }
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
      await queryClient.invalidateQueries({
        queryKey: ['workout-templates', variables.templateId],
      })
    },
  })
}

export function useDeleteWorkoutTemplate() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      await graphqlRequest(nhost, DELETE_WORKOUT_TEMPLATE, { id: templateId })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workout-templates'] })
    },
  })
}

export function exerciseToDraft(exercise: Exercise): TemplateExerciseDraft {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
    supersetId: null,
    sets: [],
  }
}

export function nextSupersetId(exercises: TemplateExerciseDraft[]): number {
  const ids = exercises
    .map((exercise) => exercise.supersetId)
    .filter((id): id is number => id != null)

  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

export function addExerciseToSuperset(
  exercises: TemplateExerciseDraft[],
  fromIndex: number,
  partnerIndex: number,
): TemplateExerciseDraft[] {
  const partner = exercises[partnerIndex]
  if (!partner) {
    return exercises
  }

  const supersetId = partner.supersetId ?? nextSupersetId(exercises)

  return exercises.map((exercise, index) =>
    index === fromIndex || index === partnerIndex
      ? { ...exercise, supersetId }
      : exercise,
  )
}

export function removeExerciseFromSuperset(
  exercises: TemplateExerciseDraft[],
  index: number,
): TemplateExerciseDraft[] {
  const target = exercises[index]
  if (!target?.supersetId) {
    return exercises
  }

  const supersetId = target.supersetId
  const remaining = exercises.filter(
    (exercise, exerciseIndex) =>
      exerciseIndex !== index && exercise.supersetId === supersetId,
  )

  if (remaining.length <= 1) {
    return exercises.map((exercise) =>
      exercise.supersetId === supersetId
        ? { ...exercise, supersetId: null }
        : exercise,
    )
  }

  return exercises.map((exercise, exerciseIndex) =>
    exerciseIndex === index ? { ...exercise, supersetId: null } : exercise,
  )
}

export function cleanupSupersetAfterRemoval(
  exercises: TemplateExerciseDraft[],
): TemplateExerciseDraft[] {
  const counts = new Map<number, number>()

  for (const exercise of exercises) {
    if (exercise.supersetId != null) {
      counts.set(exercise.supersetId, (counts.get(exercise.supersetId) ?? 0) + 1)
    }
  }

  return exercises.map((exercise) => {
    if (
      exercise.supersetId != null &&
      (counts.get(exercise.supersetId) ?? 0) < 2
    ) {
      return { ...exercise, supersetId: null }
    }

    return exercise
  })
}

export function createTemplateSet(
  setIndex: number,
  defaultRestSeconds: number,
): TemplateSetDraft {
  return {
    setIndex,
    weightKg: null,
    reps: null,
    restSeconds: defaultRestSeconds,
    usesGlobalRest: true,
  }
}
