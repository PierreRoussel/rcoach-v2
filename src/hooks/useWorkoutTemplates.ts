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
import {
  DEFAULT_EMOM_INTERVAL_SECONDS,
  DEFAULT_SESSION_MODE,
  normalizeSessionMode,
  type SessionMode,
} from '@/lib/workout/session-mode'

export type TemplateSetType = 'normal' | 'warmup' | 'failure'

export type TemplateSetDraft = {
  setIndex: number
  setType?: TemplateSetType
  weightKg: number | null
  reps: number | null
  durationSeconds?: number | null
  restSeconds: number
  usesGlobalRest: boolean
}

export type TemplateExerciseDraft = {
  exerciseId: string
  exerciseName: string
  exerciseNameFr?: string | null
  muscleGroup: string | null
  equipment: string | null
  supersetId: number | null
  emomGroupId?: number | null
  targetReps?: number | null
  defaultRestSeconds: number
  sets: TemplateSetDraft[]
}

export type TemplateDraft = {
  sessionMode: SessionMode
  emomIntervalSeconds: number
  emomTotalMinutes: number
  exercises: TemplateExerciseDraft[]
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

export function useWorkoutTemplates(options?: { enabled?: boolean }) {
  const { nhost, isAuthenticated, user } = useAuth()
  const userId = user?.id
  const queryEnabled = (options?.enabled ?? true) && isAuthenticated && Boolean(userId)

  return useQuery({
    queryKey: ['workout-templates', userId],
    enabled: queryEnabled,
    staleTime: 5 * 60_000,
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

export function templateToDraft(template: WorkoutTemplate): TemplateDraft {
  const templateDefaultRestSeconds =
    template.default_rest_seconds ?? DEFAULT_GLOBAL_REST_SECONDS
  const sessionMode = normalizeSessionMode(template.session_mode)

  return {
    sessionMode,
    emomIntervalSeconds:
      template.emom_interval_seconds ?? DEFAULT_EMOM_INTERVAL_SECONDS,
    emomTotalMinutes: template.emom_total_minutes ?? 12,
    exercises: template.workout_template_exercises.map((entry) => {
      const exerciseDefaultRestSeconds =
        entry.default_rest_seconds ?? templateDefaultRestSeconds

      return {
        exerciseId: entry.exercise.id,
        exerciseName: entry.exercise.name,
        exerciseNameFr: entry.exercise.name_fr ?? null,
        muscleGroup: entry.exercise.muscle_group,
        equipment: entry.exercise.equipment,
        supersetId: entry.superset_id ?? null,
        emomGroupId: entry.emom_group_id ?? null,
        targetReps: entry.target_reps ?? null,
        defaultRestSeconds: exerciseDefaultRestSeconds,
        sets: (entry.workout_template_sets ?? []).map((set) => ({
          setIndex: set.set_index,
          setType: normalizeTemplateSetType(set.set_type),
          weightKg: set.weight_kg,
          reps: set.reps,
          durationSeconds: set.duration_seconds ?? null,
          restSeconds: set.rest_seconds,
          usesGlobalRest: set.rest_seconds === exerciseDefaultRestSeconds,
        })),
      }
    }),
  }
}

export function useCreateWorkoutTemplate() {
  const { nhost } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      defaultRestSeconds = DEFAULT_GLOBAL_REST_SECONDS,
      sessionMode = DEFAULT_SESSION_MODE,
      emomIntervalSeconds = DEFAULT_EMOM_INTERVAL_SECONDS,
      emomTotalMinutes = 12,
      exercises = [],
    }: {
      name: string
      defaultRestSeconds?: number
      sessionMode?: SessionMode
      emomIntervalSeconds?: number
      emomTotalMinutes?: number
      exercises?: TemplateExerciseDraft[]
    }) => {
      const data = await graphqlRequest<{
        insert_workout_templates_one: WorkoutTemplate
      }>(nhost, INSERT_WORKOUT_TEMPLATE, {
        object: {
          name,
          default_rest_seconds: defaultRestSeconds,
          session_mode: sessionMode,
          emom_interval_seconds:
            sessionMode === 'emom' ? emomIntervalSeconds : null,
          emom_total_minutes: sessionMode === 'emom' ? emomTotalMinutes : null,
        },
      })

      const template = data.insert_workout_templates_one

      if (exercises.length > 0) {
        await insertTemplateExercises(nhost, template.id, exercises)
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
      folderName,
      defaultRestSeconds,
      sessionMode = DEFAULT_SESSION_MODE,
      emomIntervalSeconds = DEFAULT_EMOM_INTERVAL_SECONDS,
      emomTotalMinutes = 12,
      exercises,
    }: {
      templateId: string
      name: string
      folderName?: string | null
      defaultRestSeconds: number
      sessionMode?: SessionMode
      emomIntervalSeconds?: number
      emomTotalMinutes?: number
      exercises: TemplateExerciseDraft[]
    }) => {
      const normalizedFolderName = folderName?.trim() || null

      await graphqlRequest(nhost, UPDATE_WORKOUT_TEMPLATE, {
        id: templateId,
        name,
        folderName: normalizedFolderName,
        defaultRestSeconds,
        sessionMode,
        emomIntervalSeconds: sessionMode === 'emom' ? emomIntervalSeconds : null,
        emomTotalMinutes: sessionMode === 'emom' ? emomTotalMinutes : null,
      })
      await graphqlRequest(nhost, DELETE_WORKOUT_TEMPLATE_EXERCISES, {
        templateId,
      })
      if (exercises.length > 0) {
        await insertTemplateExercises(nhost, templateId, exercises)
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
    exerciseNameFr: exercise.name_fr ?? null,
    muscleGroup: exercise.muscle_group,
    equipment: exercise.equipment,
    supersetId: null,
    emomGroupId: null,
    targetReps: null,
    defaultRestSeconds: DEFAULT_GLOBAL_REST_SECONDS,
    sets: [],
  }
}

export function exerciseToEmomDraft(exercise: Exercise): TemplateExerciseDraft {
  return exerciseToDraft(exercise)
}

export {
  addExerciseToSuperset,
  cleanupSupersetAfterRemoval,
  nextSupersetId,
  removeExerciseFromSuperset,
} from '@/lib/workout/exercise-superset'

export function createTemplateSet(
  setIndex: number,
  defaultRestSeconds: number,
  inherited?: Pick<TemplateSetDraft, 'weightKg' | 'reps' | 'setType' | 'durationSeconds'>,
): TemplateSetDraft {
  return {
    setIndex,
    setType: inherited?.setType ?? 'normal',
    weightKg: inherited?.weightKg ?? null,
    reps: inherited?.reps ?? null,
    durationSeconds: inherited?.durationSeconds ?? null,
    restSeconds: defaultRestSeconds,
    usesGlobalRest: true,
  }
}

export function inheritSetValues(
  sets: TemplateSetDraft[],
): Pick<TemplateSetDraft, 'weightKg' | 'reps' | 'setType' | 'durationSeconds'> {
  const last = sets[sets.length - 1]
  if (last && (last.weightKg != null || last.reps != null || last.durationSeconds != null)) {
    return {
      weightKg: last.weightKg,
      reps: last.reps,
      durationSeconds: last.durationSeconds ?? null,
      setType: last.setType ?? 'normal',
    }
  }

  const firstWithValues = sets.find(
    (set) => set.weightKg != null || set.reps != null || set.durationSeconds != null,
  )
  if (firstWithValues) {
    return {
      weightKg: firstWithValues.weightKg,
      reps: firstWithValues.reps,
      durationSeconds: firstWithValues.durationSeconds ?? null,
      setType: firstWithValues.setType ?? 'normal',
    }
  }

  return { weightKg: null, reps: null, durationSeconds: null, setType: 'normal' }
}

export function reindexTemplateSets(sets: TemplateSetDraft[]): TemplateSetDraft[] {
  return sets.map((set, index) => ({ ...set, setIndex: index }))
}

function normalizeTemplateSetType(value: string | null | undefined): TemplateSetType {
  if (value === 'warmup' || value === 'failure') {
    return value
  }

  return 'normal'
}
