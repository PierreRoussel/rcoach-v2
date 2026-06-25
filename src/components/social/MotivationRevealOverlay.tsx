import { useState } from 'react'
import { Heart, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMarkMotivationRead, useReplyMotivation } from '@/hooks/useFriends'
import type { FriendMotivation } from '@/lib/graphql/operations'
import {
  MAX_MOTIVATION_MESSAGE_LENGTH,
  normalizeMotivationMessage,
} from '@/lib/social/motivation-presets'
import { cn } from '@/lib/utils'

type MotivationRevealOverlayProps = {
  motivation: FriendMotivation | null
  onClose: () => void
}

function animationClass(presetKey: FriendMotivation['preset_key'], emoji: string): string {
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
  motivation,
  onClose,
}: MotivationRevealOverlayProps) {
  const markRead = useMarkMotivationRead()
  const replyMotivation = useReplyMotivation()
  const [replyMessage, setReplyMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!motivation) {
    return null
  }

  async function handleClose() {
    if (!motivation?.read_at) {
      await markRead.mutateAsync(motivation.id)
    }
    onClose()
  }

  async function handleReply() {
    if (!motivation) {
      return
    }

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
