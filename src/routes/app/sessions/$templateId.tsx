import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'

import { TemplateEditorForm } from '@/components/workout/TemplateEditorForm'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_GLOBAL_REST_SECONDS,
  templateToDraft,
  useSaveWorkoutTemplate,
  useWorkoutTemplate,
  type TemplateExerciseDraft,
} from '@/hooks/useWorkoutTemplates'
import { useActiveWorkoutStore } from '@/lib/workout/active-store'
import { templateExercisesToActive } from '@/lib/workout/template-mapper'

export const Route = createFileRoute('/app/sessions/$templateId')({
  component: EditSessionTemplatePage,
})

function EditSessionTemplatePage() {
  const { templateId } = Route.useParams()
  const navigate = useNavigate()
  const { data: template, isLoading, error } = useWorkoutTemplate(templateId)
  const saveTemplate = useSaveWorkoutTemplate()
  const startWorkoutFromTemplate = useActiveWorkoutStore(
    (state) => state.startWorkoutFromTemplate,
  )

  const initial = useMemo(
    () => (template ? templateToDraft(template) : null),
    [template],
  )

  async function handleSave(
    name: string,
    exercises: TemplateExerciseDraft[],
  ) {
    await saveTemplate.mutateAsync({
      templateId,
      name,
      defaultRestSeconds: DEFAULT_GLOBAL_REST_SECONDS,
      exercises,
    })
  }

  async function handleStart(
    name: string,
    exercises: TemplateExerciseDraft[],
  ) {
    await saveTemplate.mutateAsync({
      templateId,
      name,
      defaultRestSeconds: DEFAULT_GLOBAL_REST_SECONDS,
      exercises,
    })
    await startWorkoutFromTemplate(
      name,
      templateExercisesToActive(exercises),
      DEFAULT_GLOBAL_REST_SECONDS,
      templateId,
    )
    await navigate({ to: '/app/workout/active' })
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>
  }

  if (error || !template || !initial) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : 'Modele introuvable.'}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/app/sessions">
          <ArrowLeft className="size-4" />
          Catalogue
        </Link>
      </Button>
      <TemplateEditorForm
        key={`${template.id}-${template.updated_at}`}
        templateId={templateId}
        initialName={template.name}
        initialExercises={initial.exercises}
        isSaving={saveTemplate.isPending}
        onSave={handleSave}
        onStart={handleStart}
      />
    </div>
  )
}
