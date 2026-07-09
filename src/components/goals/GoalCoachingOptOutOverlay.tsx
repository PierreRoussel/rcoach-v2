import { BellOff, Clock } from 'lucide-react'
import { useEffect } from 'react'

import { FullscreenCarouselOverlay } from '@/components/subscription/FullscreenCarouselOverlay'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics/track-event'

type GoalCoachingOptOutOverlayProps = {
  open: boolean
  onOptOut: () => void
  onPause: () => void
}

export function GoalCoachingOptOutOverlay({
  open,
  onOptOut,
  onPause,
}: GoalCoachingOptOutOverlayProps) {
  useEffect(() => {
    if (open) {
      trackEvent('goal_coaching_opt_out_view')
    }
  }, [open])

  const handleOptOut = () => {
    trackEvent('goal_coaching_opt_out', { choice: 'permanent' })
    onOptOut()
  }

  const handlePause = () => {
    trackEvent('goal_coaching_opt_out', { choice: 'pause_30d' })
    onPause()
  }

  return (
    <FullscreenCarouselOverlay
      open={open}
      ariaLabel="Préférences de rappel coaching"
      backgroundClassName="bg-gradient-to-b from-[#F5F3FF] to-[#EDE9FE]"
      slides={[
        <div
          key="opt-out"
          className="mx-auto flex w-full max-w-sm flex-col items-center text-center"
        >
          <BellOff className="mb-4 size-10 text-violet-500" aria-hidden />
          <h2 className="font-display text-2xl font-black text-foreground">
            Comment souhaitez-vous continuer ?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Nous pouvons mettre les rappels en pause ou arrêter définitivement
            ces suggestions de coaching.
          </p>
        </div>,
      ]}
      footer={
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            type="button"
            variant="pill"
            className="w-full gap-2"
            onClick={handlePause}
          >
            <Clock className="size-4" aria-hidden />
            Pause 30 jours
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-violet-300/60 bg-white text-foreground"
            onClick={handleOptOut}
          >
            Ne plus me rappeler
          </Button>
        </div>
      }
    />
  )
}
