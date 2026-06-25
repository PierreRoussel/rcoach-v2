import { useState } from 'react'
import { Heart, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useMarkMotivationRead,
  useMarkMotivationReplySeen,
  useReplyMotivation,
} from '@/hooks/useFriends'
import {
  MAX_MOTIVATION_MESSAGE_LENGTH,
  normalizeMotivationMessage,
} from '@/lib/social/motivation-presets'
import type { MotivationNotification } from '@/lib/social/motivation-notifications'
import { cn } from '@/lib/utils'

type MotivationRevealOverlayProps = {
  notification: MotivationNotification | null
  onClose: () => void
}

function animationClass(
  presetKey: MotivationNotification['motivation']['preset_key'],
  emoji: string,
): string {
  if (presetKey === 'fire' || emoji.includes('🔥')) {
    return 'animate-motivation-bounce'
  }
  if (presetKey === 'muscle' || emoji.includes('💪')) {
    return 'animate-motivation-pulse'
  }
  if (presetKey === 'clap' || emoji.includes('👏')) {
    return 'animate-motivation-pop'
  }
  return 'animate-motivation-pop'
}

export function MotivationRevealOverlay({
  notification,
  onClose,
}: MotivationRevealOverlayProps) {
  const markRead = useMarkMotivationRead()
  const markReplySeen = useMarkMotivationReplySeen()
  const replyMotivation = useReplyMotivation()
  const [replyMessage, setReplyMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!notification) {
    return null
  }

  const { motivation, kind } = notification

  async function handleClose() {
    if (kind === 'received' && !motivation.read_at) {
      await markRead.mutateAsync(motivation.id)
    }

    if (kind === 'heart_reply' && !motivation.sender_reply_seen_at) {
      await markReplySeen.mutateAsync(motivation.id)
    }

    onClose()
  }

  async function handleReply() {
    setError(null)

    try {
      const normalized = replyMessage.trim()
        ? normalizeMotivationMessage(replyMessage)
        : undefined

      await replyMotivation.mutateAsync({
        motivationId: motivation.id,
        replyMessage: normalized,
      })
      onClose()
      setReplyMessage('')
    } catch (replyError) {
      setError(
        replyError instanceof Error
          ? replyError.message
          : 'Impossible d’envoyer votre réponse.',
      )
    }
  }

  if (kind === 'heart_reply') {
    const friendName = motivation.recipient?.display_name ?? 'Un ami'

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-card p-6 text-center shadow-2xl">
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Fermer"
            onClick={() => void handleClose()}
          >
            <X className="size-4" />
          </button>

          <p className="text-sm text-muted-foreground">{friendName} répond à votre emoji</p>
          <div className="my-6 text-7xl leading-none animate-motivation-pulse">❤️</div>
          <p className="font-display text-xl font-black text-foreground">
            {motivation.reply_message?.trim() || 'Merci pour l’encouragement !'}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Votre emoji envoyé : {motivation.emoji}
          </p>

          <Button
            type="button"
            variant="pill"
            className="mt-6 w-full"
            onClick={() => void handleClose()}
          >
            Fermer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-card p-6 text-center shadow-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted"
          aria-label="Fermer"
          onClick={() => void handleClose()}
        >
          <X className="size-4" />
        </button>

        <p className="text-sm text-muted-foreground">
          {motivation.sender?.display_name ?? 'Un ami'} vous envoie
        </p>
        <div
          className={cn(
            'my-6 text-7xl leading-none',
            animationClass(motivation.preset_key, motivation.emoji),
          )}
        >
          {motivation.emoji}
        </div>
        <p className="font-display text-xl font-black text-foreground">{motivation.message}</p>

        <div className="mt-6 space-y-3">
          <Input
            value={replyMessage}
            maxLength={MAX_MOTIVATION_MESSAGE_LENGTH}
            placeholder="Répondre avec un mot (facultatif)"
            onChange={(event) => setReplyMessage(event.target.value)}
          />
          <Button
            type="button"
            variant="pill"
            className="w-full"
            disabled={replyMotivation.isPending}
            onClick={() => void handleReply()}
          >
            <Heart className="size-4 fill-current" />
            {replyMotivation.isPending ? 'Envoi...' : 'Répondre avec un cœur'}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}
