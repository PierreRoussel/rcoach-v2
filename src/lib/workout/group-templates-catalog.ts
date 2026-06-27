import type { WorkoutTemplate } from '@/lib/graphql/operations'
import type { ScheduledSessionRecord } from '@/lib/graphql/operations'

export type TemplateCatalogGroupKind = 'schedule' | 'folder' | 'other'

export type TemplateCatalogGroup = {
  id: string
  title: string
  kind: TemplateCatalogGroupKind
  templates: WorkoutTemplate[]
}

type GroupTemplatesCatalogInput = {
  templates: WorkoutTemplate[]
  scheduledSessions: ScheduledSessionRecord[]
}

function normalizeFolderName(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function getScheduledTemplateIds(session: ScheduledSessionRecord): string[] {
  const ids: string[] = []

  if (session.workout_template_id) {
    ids.push(session.workout_template_id)
  }
  if (session.workout_template_id_b) {
    ids.push(session.workout_template_id_b)
  }

  return ids
}

function appendTemplates(
  target: WorkoutTemplate[],
  templateIds: string[],
  templateById: Map<string, WorkoutTemplate>,
  seenInGroup: Set<string>,
) {
  for (const templateId of templateIds) {
    if (seenInGroup.has(templateId)) {
      continue
    }

    const template = templateById.get(templateId)
    if (!template) {
      continue
    }

    seenInGroup.add(templateId)
    target.push(template)
  }
}

export function groupTemplatesForCatalog({
  templates,
  scheduledSessions,
}: GroupTemplatesCatalogInput): TemplateCatalogGroup[] {
  const templateById = new Map(templates.map((template) => [template.id, template]))
  const scheduledTemplateIds = new Set<string>()
  const groups: TemplateCatalogGroup[] = []

  const activeSessions = [...scheduledSessions]
    .filter((session) => session.is_active)
    .sort((left, right) => left.title.localeCompare(right.title, 'fr'))

  for (const session of activeSessions) {
    const groupTemplates: WorkoutTemplate[] = []
    const seenInGroup = new Set<string>()
    appendTemplates(
      groupTemplates,
      getScheduledTemplateIds(session),
      templateById,
      seenInGroup,
    )

    if (groupTemplates.length === 0) {
      continue
    }

    for (const template of groupTemplates) {
      scheduledTemplateIds.add(template.id)
    }

    groups.push({
      id: `schedule-${session.id}`,
      title: session.title,
      kind: 'schedule',
      templates: groupTemplates,
    })
  }

  const folderMap = new Map<string, WorkoutTemplate[]>()

  for (const template of templates) {
    if (scheduledTemplateIds.has(template.id)) {
      continue
    }

    const folderName = normalizeFolderName(template.folder_name)
    if (!folderName) {
      continue
    }

    const bucket = folderMap.get(folderName) ?? []
    bucket.push(template)
    folderMap.set(folderName, bucket)
  }

  for (const [folderName, folderTemplates] of [...folderMap.entries()].sort(([left], [right]) =>
    left.localeCompare(right, 'fr'),
  )) {
    groups.push({
      id: `folder-${folderName}`,
      title: folderName,
      kind: 'folder',
      templates: folderTemplates,
    })
  }

  const otherTemplates = templates.filter(
    (template) =>
      !scheduledTemplateIds.has(template.id) &&
      !normalizeFolderName(template.folder_name),
  )

  if (otherTemplates.length > 0) {
    groups.push({
      id: 'other',
      title: 'Autres',
      kind: 'other',
      templates: otherTemplates,
    })
  }

  return groups
}

export function shouldUseTemplateCatalogAccordions(groups: TemplateCatalogGroup[]): boolean {
  if (groups.length === 0) {
    return false
  }

  if (groups.length === 1 && groups[0]?.kind === 'other') {
    return false
  }

  return true
}
