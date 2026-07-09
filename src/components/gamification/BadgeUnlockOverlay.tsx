import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

import { BadgeArt } from '@/components/gamification/BadgeArt'
import { Button } from '@/components/ui/button'
import { BADGE_TIER_CLASSES } from '@/lib/gamification/badges'
import type { BadgeDefinition } from '@/lib/gamification/badges'
import { hasBadgeAsset } from '@/lib/gamification/badge-assets'
import { cn } from '@/lib/utils'

type BadgeUnlockOverlayProps = {
  badges: BadgeDefinition[]
  open: boolean
  onClose: () => void
}

export function BadgeUnlockOverlay({ badges, open, onClose }: BadgeUnlockOverlayProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || badges.length === 0) {
    return null
  }

  const primary = badges[0]
  const usesCustomArt = hasBadgeAsset(primary.key)

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-background/90 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Nouvelle médaille débloquée"
      onClick={onClose}
    >
      <div
        className="pointer-events-auto w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-8 text-primary" aria-hidden />
        </div>

        <p className="font-display text-xl font-black">Nouvelle médaille !</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {badges.length > 1
            ? `${badges.length} médailles débloquées`
            : 'Bravo pour cette progression.'}
        </p>

        <div
          className={cn(
            'mx-auto mt-5 flex max-w-xs flex-col items-center gap-2 rounded-2xl border p-4',
            usesCustomArt ? 'border-border/70 bg-card text-foreground' : BADGE_TIER_CLASSES[primary.tier],
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center',
              usesCustomArt ? 'size-32' : 'size-14 rounded-full border border-current/20 bg-white/50',
            )}
          >
            <BadgeArt
              badgeKey={primary.key}
              icon={primary.icon}
              imageClassName="size-32"
              iconClassName="size-7"
            />
          </span>
          <p className="font-display text-lg font-black">{primary.label}</p>
          <p className="text-sm">{primary.description}</p>
        </div>

        {badges.length > 1 ? (
          <ul className="mt-4 space-y-1 text-left text-sm text-muted-foreground">
            {badges.slice(1, 4).map((badge) => (
              <li key={badge.key}>• {badge.label}</li>
            ))}
            {badges.length > 4 ? (
              <li>• +{badges.length - 4} autre(s)</li>
            ) : null}
          </ul>
        ) : null}

        <Button type="button" variant="pill" className="mt-6 w-full" onClick={onClose}>
          Continuer
        </Button>
      </div>
    </div>
  )
}
