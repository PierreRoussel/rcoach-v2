import { Link2, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { FeedbackMessage } from '@/components/ui/feedback-message'
import {
  copyTemplateShareLink,
  ensureTemplateShareToken,
  isTemplateShareSchemaError,
  useEnableTemplateShare,
} from '@/hooks/useTemplateSharing'
import type { WorkoutTemplate } from '@/lib/graphql/operations'

type TemplateShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Pick<WorkoutTemplate, 'id' | 'name' | 'share_token'>
}

export function TemplateShareDialog({
  open,
  onOpenChange,
  template,
}: TemplateShareDialogProps) {
  const enableShare = useEnableTemplateShare()
  const [shareToken, setShareToken] = useState(template.share_token ?? null)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resolveShareToken() {
    return ensureTemplateShareToken(
      { ...template, share_token: shareToken ?? template.share_token },
      async (input) => {
        const result = await enableShare.mutateAsync(input)
        setShareToken(result.share_token)
        return result
      },
    )
  }

  async function handleCopyLink() {
    setError(null)
    setMessage(null)
    setIsBusy(true)

    try {
      const token = await resolveShareToken()
      const url = await copyTemplateShareLink(token)
      setMessage(`Lien copié : ${url}`)
    } catch (linkError) {
      if (isTemplateShareSchemaError(linkError)) {
        setError(
          'Le partage nécessite un redéploiement Nhost (migration template_sharing).',
        )
        return
      }

      setError(
        linkError instanceof Error ? linkError.message : 'Impossible de copier le lien.',
      )
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display font-black">Partager le modèle</DrawerTitle>
          <DrawerDescription>
            Copiez un lien pour que d&apos;autres personnes puissent ajouter « {template.name} »
            à leurs modèles. Chacun garde sa propre copie indépendante.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <Button
            type="button"
            variant="pill"
            disabled={isBusy}
            onClick={() => void handleCopyLink()}
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Copier le lien
          </Button>

          {message ? <FeedbackMessage variant="success">{message}</FeedbackMessage> : null}
          {error ? <FeedbackMessage variant="error">{error}</FeedbackMessage> : null}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
