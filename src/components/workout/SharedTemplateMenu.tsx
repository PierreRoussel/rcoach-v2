import { useNavigate } from '@tanstack/react-router'
import { BookmarkPlus, MoreVertical } from 'lucide-react'
import { useState } from 'react'

import { SessionNameDialog } from '@/components/workout/SessionNameDialog'
import { TemplateLimitDialog } from '@/components/subscription/TemplateLimitDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useImportTemplateFromShare } from '@/hooks/useTemplateSharing'
import { useEntitlement } from '@/hooks/useSubscription'
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates'
import type { SharedWorkoutTemplate, WorkoutTemplate } from '@/lib/graphql/operations'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { FREE_WORKOUT_TEMPLATES } from '@/lib/subscription/entitlements'

type SharedTemplateMenuProps = {
  template: WorkoutTemplate | SharedWorkoutTemplate
  compact?: boolean
}

export function SharedTemplateMenu({
  template,
  compact = false,
}: SharedTemplateMenuProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const importTemplate = useImportTemplateFromShare()
  const { entitled: hasUnlimitedTemplates } = useEntitlement('unlimited_templates')
  const { data: templates } = useWorkoutTemplates({ enabled: isAuthenticated })
  const templateCount = templates?.length ?? 0
  const atTemplateLimit =
    !hasUnlimitedTemplates && templateCount >= FREE_WORKOUT_TEMPLATES

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleMenuAction() {
    if (!isAuthenticated) {
      const returnTo = `${window.location.pathname}${window.location.search}`
      void navigate({ to: '/auth/login', search: { returnTo } })
      return
    }

    if (atTemplateLimit) {
      setLimitDialogOpen(true)
      return
    }

    setSaveDialogOpen(true)
  }

  async function handleImport(name: string) {
    setError(null)

    try {
      const created = await importTemplate.mutateAsync({ template, name })
      await navigate({
        to: '/app/sessions/$templateId',
        params: { templateId: created.id },
      })
    } catch (importError) {
      const message =
        importError instanceof Error
          ? importError.message
          : "Impossible d'ajouter le modèle."
      setError(message)
      throw importError
    }
  }

  return (
    <div
      className="flex flex-col items-end gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={compact ? 'ghost' : 'outline'}
            size="icon"
            className={compact ? 'size-8 rounded-full' : 'rounded-full'}
            aria-label="Actions du modèle"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            disabled={importTemplate.isPending}
            onClick={handleMenuAction}
          >
            <BookmarkPlus className="size-4" />
            Ajouter le modèle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error ? (
        <p
          className={
            compact
              ? 'max-w-32 truncate text-right text-xs text-destructive'
              : 'max-w-56 text-right text-xs text-destructive'
          }
        >
          {error}
        </p>
      ) : null}

      <TemplateLimitDialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen} />

      <SessionNameDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onConfirm={handleImport}
        isPending={importTemplate.isPending}
        title="Ajouter le modèle"
        description="Importez ce modèle dans votre catalogue. Vos modifications resteront indépendantes."
        placeholder={template.name}
        confirmLabel="Ajouter"
        defaultName={template.name}
        quotaRecap={
          !hasUnlimitedTemplates
            ? { current: templateCount, max: FREE_WORKOUT_TEMPLATES }
            : undefined
        }
      />
    </div>
  )
}
