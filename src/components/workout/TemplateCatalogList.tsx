import { Link } from '@tanstack/react-router'
import { CalendarDays, Dumbbell, Folder, Pencil, Play, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import type { WorkoutTemplate, ScheduledSessionRecord } from '@/lib/graphql/operations'
import { formatRelativeScheduleDate } from '@/lib/schedule/format-relative-schedule-date'
import {
  groupTemplatesForCatalog,
  shouldUseTemplateCatalogAccordions,
  type TemplateCatalogGroup,
} from '@/lib/workout/group-templates-catalog'
import { cn } from '@/lib/utils'

type TemplateCatalogListProps = {
  templates: WorkoutTemplate[]
  scheduledSessions: ScheduledSessionRecord[]
  nextOccurrenceByTemplateId: Map<string, string>
  onStart: (template: WorkoutTemplate) => void
  onDelete: (templateId: string) => void
  isDeleting?: boolean
}

function GroupIcon({ kind }: { kind: TemplateCatalogGroup['kind'] }) {
  if (kind === 'schedule') {
    return <CalendarDays className="size-4 shrink-0 text-primary" />
  }

  if (kind === 'folder') {
    return <Folder className="size-4 shrink-0 text-muted-foreground" />
  }

  return null
}

function TemplateCatalogRow({
  template,
  nextOccurrenceDate,
  onStart,
  onDelete,
  isDeleting,
}: {
  template: WorkoutTemplate
  nextOccurrenceDate?: string
  onStart: (template: WorkoutTemplate) => void
  onDelete: (templateId: string) => void
  isDeleting?: boolean
}) {
  return (
    <div className="relative w-full bg-card px-4 py-3 transition-colors hover:bg-muted/20">
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-display font-black">{template.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Dumbbell className="size-3 shrink-0" />
            {template.workout_template_exercises.length} exercices
          </p>
        </div>
        {nextOccurrenceDate ? (
          <Pill tone="secondary" className="shrink-0">
            <CalendarDays className="size-3" />
            {formatRelativeScheduleDate(nextOccurrenceDate)}
          </Pill>
        ) : null}
      </div>
      <div className="mt-3 flex w-full min-w-0 gap-2">
        <Button
          variant="pill"
          size="sm"
          className="min-w-0 flex-1"
          onClick={() => onStart(template)}
        >
          <Play className="size-4" />
          Démarrer
        </Button>
        <Button variant="soft" size="sm" className="min-w-0 flex-1" asChild>
          <Link to="/app/sessions/$templateId" params={{ templateId: template.id }}>
            <Pencil className="size-4" />
            Modifier
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => onDelete(template.id)}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function TemplateGroupList({
  templates,
  nextOccurrenceByTemplateId,
  onStart,
  onDelete,
  isDeleting,
}: Omit<TemplateCatalogListProps, 'scheduledSessions'>) {
  return (
    <ul className="divide-y divide-border">
      {templates.map((template) => (
        <li key={template.id}>
          <TemplateCatalogRow
            template={template}
            nextOccurrenceDate={nextOccurrenceByTemplateId.get(template.id)}
            onStart={onStart}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </li>
      ))}
    </ul>
  )
}

export function TemplateCatalogList({
  templates,
  scheduledSessions,
  nextOccurrenceByTemplateId,
  onStart,
  onDelete,
  isDeleting,
}: TemplateCatalogListProps) {
  const groups = useMemo(
    () => groupTemplatesForCatalog({ templates, scheduledSessions }),
    [templates, scheduledSessions],
  )
  const useAccordions = shouldUseTemplateCatalogAccordions(groups)
  const defaultOpenGroups = useMemo(
    () => groups.slice(0, Math.min(groups.length, 2)).map((group) => group.id),
    [groups],
  )

  if (!useAccordions) {
    return (
      <div className="border-t border-border">
        <TemplateGroupList
          templates={templates}
          nextOccurrenceByTemplateId={nextOccurrenceByTemplateId}
          onStart={onStart}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>
    )
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpenGroups}
      className="border-t border-border"
    >
      {groups.map((group) => (
        <AccordionItem key={group.id} value={group.id} className="border-border px-0">
          <AccordionTrigger
            className={cn(
              'px-4 py-3 hover:no-underline',
              'font-display text-sm font-black text-foreground',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <GroupIcon kind={group.kind} />
              <span className="truncate">{group.title}</span>
              <span className="font-data text-xs font-normal text-muted-foreground">
                ({group.templates.length})
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <TemplateGroupList
              templates={group.templates}
              nextOccurrenceByTemplateId={nextOccurrenceByTemplateId}
              onStart={onStart}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
