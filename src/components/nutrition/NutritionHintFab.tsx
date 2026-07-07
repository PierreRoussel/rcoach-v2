import { Lightbulb, Lock, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { NutritionAdvicePremiumDialog } from '@/components/subscription/NutritionAdvicePremiumDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNutritionHintAvailability, useNutritionHints } from '@/hooks/useNutritionHints'
import { useEntitlement } from '@/hooks/useSubscription'
import { useCurrentWeightKg } from '@/hooks/useWeightGoal'
import { useTypewriterWords } from '@/hooks/useTypewriterWords'
import { cn } from '@/lib/utils'
import type { NutritionSettings } from '@/lib/nutrition/types'

type NutritionHintFabProps = {
  anchorDate: string
  settings: NutritionSettings
  hidden?: boolean
}

export function NutritionHintFab({ anchorDate, settings, hidden = false }: NutritionHintFabProps) {
  const [open, setOpen] = useState(false)
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const currentWeightKg = useCurrentWeightKg()
  const { entitled: hasAiAdvice } = useEntitlement('ai_advice')
  const { hasActionableHint } = useNutritionHintAvailability(
    anchorDate,
    settings,
    currentWeightKg,
  )
  const { data, isLoading, isFetching, isError } = useNutritionHints(
    anchorDate,
    settings,
    open && hasAiAdvice,
    currentWeightKg,
  )

  const message = data?.hint.message ?? ''
  const { visibleText, isComplete } = useTypewriterWords(message)

  useEffect(() => {
    if (!hasActionableHint) {
      setOpen(false)
    }
  }, [hasActionableHint])

  useEffect(() => {
    if (!open || !hasAiAdvice) {
      return
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (!target || bubbleRef.current?.contains(target)) {
        return
      }

      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open, hasAiAdvice])

  if (hidden || !hasActionableHint) {
    return null
  }

  const showLoading = hasAiAdvice && open && (isLoading || isFetching) && !data
  const showEmpty = hasAiAdvice && open && !showLoading && data?.metrics.totalEntries === 0

  function handleFabClick() {
    if (!hasAiAdvice) {
      setPremiumDialogOpen(true)
      return
    }

    setOpen((value) => !value)
  }

  return (
    <>
      <NutritionAdvicePremiumDialog
        open={premiumDialogOpen}
        onOpenChange={setPremiumDialogOpen}
      />

      {hasAiAdvice && open ? (
        <div
          ref={bubbleRef}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom)+5rem)] right-4 z-30 max-w-xs rounded-2xl border bg-card p-4 shadow-lg"
          role="dialog"
          aria-label="Conseil nutrition"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lightbulb className="size-4 text-amber-500" aria-hidden />
              Conseil du jour
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {showLoading ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : showEmpty ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Note au moins un repas sur les 3 derniers jours pour recevoir un conseil personnalisé.
            </p>
          ) : isError ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Impossible de charger le conseil pour le moment. Réessaie dans un instant.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-foreground">
              {visibleText}
              {!isComplete ? <span className="animate-pulse"> ▍</span> : null}
            </p>
          )}
        </div>
      ) : null}

      <Button
        type="button"
        size="icon"
        className={cn(
          'fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-30 size-14 rounded-full shadow-lg',
          hasAiAdvice && open && 'ring-2 ring-amber-400/60',
          !hasAiAdvice && 'border border-primary/30 bg-soft-primary/40',
        )}
        aria-label={
          hasAiAdvice
            ? open
              ? 'Fermer le conseil nutrition'
              : 'Afficher un conseil nutrition'
            : 'Débloquer les conseils nutrition Premium'
        }
        aria-expanded={hasAiAdvice ? open : undefined}
        onClick={handleFabClick}
      >
        {hasAiAdvice ? (
          <Lightbulb className="size-6" />
        ) : (
          <span className="relative">
            <Lightbulb className="size-6 opacity-70" aria-hidden />
            <Lock
              className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-background text-primary"
              aria-hidden
            />
          </span>
        )}
      </Button>
    </>
  )
}
