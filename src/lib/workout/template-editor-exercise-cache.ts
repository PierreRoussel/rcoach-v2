import type { TemplateExerciseDraft } from '@/hooks/useWorkoutTemplates'

const cache = new Map<string, TemplateExerciseDraft[]>()

export function rememberTemplateEditorExercises(
  templateId: string,
  exercises: TemplateExerciseDraft[],
) {
  cache.set(templateId, exercises)
}

export function recallTemplateEditorExercises(
  templateId: string,
): TemplateExerciseDraft[] | null {
  return cache.get(templateId) ?? null
}

export function forgetTemplateEditorExercises(templateId: string) {
  cache.delete(templateId)
}
