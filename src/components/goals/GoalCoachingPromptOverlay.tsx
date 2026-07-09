import { Target } from 'lucide-react'
import { useEffect } from 'react'

import { FullscreenCarouselOverlay } from '@/components/subscription/FullscreenCarouselOverlay'
import { Button } from '@/components/ui/button'
import { Pill } from '@/design-system'
import { trackEvent } from '@/lib/analytics/track-event'

type GoalCoachingPromptOverlayProps = {
  open: boolean
  goalLabel: string
  onAccept: () => void
  onDismiss: () => void
}

export function GoalCoachingPromptOverlay({
  open,
  goalLabel,
  onAccept,
  onDismiss,
}: GoalCoachingPromptOverlayProps) {
  useEffect(() => {
    if (open) {
      trackEvent('goal_coaching_prompt_view')
    }
  }, [open])

  const handleAccept = () => {
    trackEvent('goal_coaching_accept')
    onAccept()
  }

  const handleDismiss = () => {
    trackEvent('goal_coaching_dismiss')
    onDismiss()
  }

  return (
    <FullscreenCarouselOverlay
      open={open}
      ariaLabel="Coaching objectif poids"
      backgroundClassName="bg-gradient-to-b from-[#F5F3FF] to-[#EDE9FE]"
      slides={[
        <div
          key="prompt"
          className="mx-auto flex w-full max-w-sm flex-col items-center text-center"
        >
          <Target className="mb-4 size-10 text-violet-500" aria-hidden />
          <Pill tone="solid-purple" className="gap-1">
            Coaching objectif
          </Pill>
          <h2 className="mt-4 font-display text-2xl font-black text-[#2c2545]">
            Votre progression stagne
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5c5278]">
            Votre objectif de {goalLabel.toLowerCase()} n&apos;a pas évolué
            depuis 2 semaines. Souhaitez-vous des indications pour relancer la
            dynamique ?
          </p>
        </div>,
      ]}
      footer={
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button
            type="button"
            variant="pill"
            className="w-full"
            onClick={handleAccept}
          >
            Oui, guidez-moi
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-violet-300/60 bg-white text-[#2c2545]"
            onClick={handleDismiss}
          >
            Plus tard
          </Button>
        </div>
      }
    />
  )
}
