import { createFileRoute } from '@tanstack/react-router'
import { Dumbbell } from 'lucide-react'

import { SharedTemplateMenu } from '@/components/workout/SharedTemplateMenu'
import { TemplatePreviewContent } from '@/components/workout/TemplatePreviewContent'
import { BrandLogo, PageHeader, Pill } from '@/design-system'
import { useSharedTemplateByToken } from '@/hooks/useTemplateSharing'
import {
  formatEmomTemplateMeta,
  getTemplateSessionLabel,
} from '@/lib/workout/template-session-label'

export const Route = createFileRoute('/share/template/$shareToken')({
  component: SharedTemplatePage,
})

function SharedTemplatePage() {
  const { shareToken } = Route.useParams()
  const { data: template, isLoading, error } = useSharedTemplateByToken(shareToken)

  if (isLoading) {
    return (
      <div className="mx-auto min-h-svh max-w-lg bg-background p-4">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="mx-auto min-h-svh max-w-lg bg-background p-4">
        <BrandLogo compact />
        <p className="mt-6 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Modèle introuvable.'}
        </p>
      </div>
    )
  }

  const exerciseCount = template.workout_template_exercises.length

  return (
    <div className="mx-auto min-h-svh max-w-lg bg-background p-4">
      <BrandLogo compact />
      <div className="mt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            eyebrow="Modèle partagé"
            title={template.name}
            description={
              template.user?.display_name
                ? `Par ${template.user.display_name}`
                : undefined
            }
            className="min-w-0 flex-1"
          />
          <SharedTemplateMenu template={template} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill tone="solid-gold" className="gap-1">
            <Dumbbell className="size-3" />
            {exerciseCount} exercice(s)
          </Pill>
          {getTemplateSessionLabel(template.session_mode) ? (
            <Pill tone="secondary">{getTemplateSessionLabel(template.session_mode)}</Pill>
          ) : null}
          {formatEmomTemplateMeta(
            template.session_mode,
            template.emom_total_minutes,
            template.emom_interval_seconds,
          ) ? (
            <Pill tone="default">
              {formatEmomTemplateMeta(
                template.session_mode,
                template.emom_total_minutes,
                template.emom_interval_seconds,
              )}
            </Pill>
          ) : null}
        </div>

        <TemplatePreviewContent template={template} />
      </div>
    </div>
  )
}
