import { FREE_WORKOUT_TEMPLATES } from '@/lib/subscription/entitlements'

export type TemplateUsageEntry = {
  id: string
  usageCount: number
  updatedAt: string
}

export function countTemplateUsageFromWorkouts(
  workouts: Array<{ workout_template_id?: string | null }>,
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const workout of workouts) {
    const templateId = workout.workout_template_id
    if (!templateId) {
      continue
    }

    counts.set(templateId, (counts.get(templateId) ?? 0) + 1)
  }

  return counts
}

export function rankTemplatesByUsage(
  templates: Array<{ id: string; updated_at: string }>,
  usageByTemplateId: Map<string, number>,
): TemplateUsageEntry[] {
  return [...templates]
    .map((template) => ({
      id: template.id,
      usageCount: usageByTemplateId.get(template.id) ?? 0,
      updatedAt: template.updated_at,
    }))
    .sort((left, right) => {
      if (right.usageCount !== left.usageCount) {
        return right.usageCount - left.usageCount
      }

      return right.updatedAt.localeCompare(left.updatedAt)
    })
}

export function resolveFrozenTemplateIds(
  rankedTemplates: TemplateUsageEntry[],
  isPremium: boolean,
  maxActive = FREE_WORKOUT_TEMPLATES,
): Set<string> {
  if (isPremium || rankedTemplates.length <= maxActive) {
    return new Set()
  }

  const activeIds = new Set(rankedTemplates.slice(0, maxActive).map((entry) => entry.id))

  return new Set(
    rankedTemplates
      .filter((entry) => !activeIds.has(entry.id))
      .map((entry) => entry.id),
  )
}

export function isTemplateFrozen(
  templateId: string,
  frozenIds: Set<string>,
): boolean {
  return frozenIds.has(templateId)
}

export function countActiveTemplates(
  templates: Array<{ id: string }>,
  frozenIds: Set<string>,
): number {
  return templates.filter((template) => !frozenIds.has(template.id)).length
}
