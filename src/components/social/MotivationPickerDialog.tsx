import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSendMotivation } from '@/hooks/useFriends'
import {
  MOTIVATION_PRESETS,
  MAX_MOTIVATION_MESSAGE_LENGTH,
  type MotivationPresetKey,
} from '@/lib/social/motivation-presets'

type MotivationPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientId: string
  recipientName: string
}

export function MotivationPickerDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
}: MotivationPickerDialogProps) {
  const sendMotivation = useSendMotivation()
  const [customEmoji, setCustomEmoji] = useState('✨')
  const [customMessage, setCustomMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const presets = useMemo(() => MOTIVATION_PRESETS, [])

  async function handleSend(
    emoji: string,
    message: string,
    presetKey: MotivationPresetKey,
  ) {
    if (!recipientId) {
      return
    }

    setError(null)

    try {
      await sendMotivation.mutateAsync({
        recipientId,
        emoji,
        message,
        presetKey,
      })
      onOpenChange(false)
      setCustomMessage('')
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Impossible d’envoyer la motivation.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-black">
            Motiver {recipientName}
          </DialogTitle>
          <DialogDescription>
            Choisissez un emoji rapide ou composez votre message.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.key}
              type="button"
              variant="outline"
              className="h-auto flex-col gap-1 rounded-2xl py-3"
              disabled={sendMotivation.isPending}
              onClick={() =>
                void handleSend(preset.emoji, preset.defaultMessage, preset.key)
              }
            >
              <span className="text-2xl">{preset.emoji}</span>
              <span className="text-xs">{preset.label}</span>
            </Button>
          ))}
        </div>

        <div className="space-y-2 rounded-2xl border border-border p-3">
          <Label htmlFor="custom-emoji">Personnalisé</Label>
          <div className="flex gap-2">
            <Input
              id="custom-emoji"
              value={customEmoji}
              maxLength={4}
              className="w-20 text-center text-xl"
              onChange={(event) => setCustomEmoji(event.target.value)}
            />
            <Input
              value={customMessage}
              maxLength={MAX_MOTIVATION_MESSAGE_LENGTH}
              placeholder="Votre message court"
              onChange={(event) => setCustomMessage(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="pill"
            className="w-full"
            disabled={sendMotivation.isPending || customMessage.trim().length === 0}
            onClick={() =>
              void handleSend(customEmoji, customMessage, 'custom')
            }
          >
            {sendMotivation.isPending ? 'Envoi...' : 'Envoyer le message'}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
