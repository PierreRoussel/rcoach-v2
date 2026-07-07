import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Crown, Lock, TrendingUp, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

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
import { Pill } from '@/design-system'
import { useLastExercisePerformance } from '@/hooks/useExercises'
import type { Exercise } from '@/lib/graphql/operations'
import {
  formatLastSessionReference,
  isWarmUpExerciseName,
  suggestProgressiveOverload,
  type OverloadSuggestion,
} from '@/lib/workout/progressive-overload'
import { cn } from '@/lib/utils'

type OverloadGateState = {
  isPremium: boolean
  isFreeExerciseOfDay: boolean
  isFreeQuotaAvailable: boolean
}

type ExerciseOverloadHintProps = {
  exercise: Pick<Exercise, 'id' | 'name' | 'equipment'>
  bodyWeightKg?: number | null
  onApply?: (suggestion: OverloadSuggestion) => void
  compact?: boolean
  className?: string
  overloadGate?: OverloadGateState
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function OverloadAdjustDialog({
  open,
  onOpenChange,
  suggestion,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestion: OverloadSuggestion
  onConfirm: (suggestion: OverloadSuggestion) => void
}) {
  const [weightValue, setWeightValue] = useState('')
  const [repsValue, setRepsValue] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setWeightValue(
      suggestion.suggestedWeightKg != null ? String(suggestion.suggestedWeightKg) : '',
    )
    setRepsValue(
      suggestion.suggestedReps != null ? String(suggestion.suggestedReps) : '',
    )
  }, [open, suggestion])

  function handleConfirm() {
    onConfirm({
      ...suggestion,
      suggestedWeightKg: parseOptionalNumber(weightValue),
      suggestedReps: parseOptionalNumber(repsValue),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black">Ajuster la surcharge</DialogTitle>
          <DialogDescription>
            Modifiez la charge et les répétitions a appliquer aux séries de travail.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="overload-weight">Nouvelle charge</Label>
            <Input
              id="overload-weight"
              inputMode="decimal"
              placeholder="kg"
              value={weightValue}
              onChange={(event) => setWeightValue(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overload-reps">Nouvelles reps</Label>
            <Input
              id="overload-reps"
              inputMode="numeric"
              placeholder="reps"
              value={repsValue}
              onChange={(event) => setRepsValue(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" variant="pill" onClick={handleConfirm}>
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OverloadHintActions({
  onApply,
  onAdjust,
  onDismiss,
}: {
  onApply?: () => void
  onAdjust?: () => void
  onDismiss: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onApply ? (
        <Button
          type="button"
          variant="soft"
          size="sm"
          className="h-7 rounded-full px-3 text-xs"
          onClick={onApply}
        >
          Appliquer
        </Button>
      ) : null}
      {onAdjust ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-3 text-xs"
          onClick={onAdjust}
        >
          Ajuster
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Masquer le hint"
        onClick={onDismiss}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}

export function ExerciseOverloadHint({
  exercise,
  bodyWeightKg,
  onApply,
  compact = false,
  className,
  overloadGate,
}: ExerciseOverloadHintProps) {
  const { data: lastPerformance, isLoading } = useLastExercisePerformance(exercise.id)
  const [dismissed, setDismissed] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)

  const suggestion = lastPerformance
    ? suggestProgressiveOverload(exercise, lastPerformance, { bodyWeightKg })
    : null

  const isPremium = overloadGate?.isPremium ?? true
  const canUseFreeAdvice =
    !isPremium &&
    overloadGate?.isFreeExerciseOfDay === true &&
    overloadGate?.isFreeQuotaAvailable === true
  const isLocked = !isPremium && !canUseFreeAdvice

  useEffect(() => {
    setDismissed(false)
  }, [exercise.id])

  if (isWarmUpExerciseName(exercise.name)) {
    return null
  }

  function handleApplySuggestion(nextSuggestion: OverloadSuggestion) {
    onApply?.(nextSuggestion)
    setDismissed(true)
  }

  if (dismissed) {
    return null
  }

  if (isLoading) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        Chargement de la surcharge...
      </p>
    )
  }

  if (!lastPerformance?.bestSet) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        Première fois sur cet exercice — validez une série de référence.
      </p>
    )
  }

  if (!suggestion) {
    return null
  }

  if (isLocked) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border/70 bg-muted/30 px-3 py-2',
          className,
        )}
      >
        <div className="space-y-2 blur-[2px] opacity-70">
          <p className="text-xs leading-relaxed text-foreground">{suggestion.message}</p>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/70 p-3 text-center backdrop-blur-[1px]">
          <Lock className="size-4 text-muted-foreground" aria-hidden />
          <Pill tone="solid-primary" className="gap-1">
            <Crown className="size-3" aria-hidden />
            Premium
          </Pill>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {overloadGate?.isFreeQuotaAvailable
              ? 'Conseil du jour disponible sur un autre exercice.'
              : 'Conseil gratuit du jour déjà utilisé.'}
          </p>
          <Button variant="soft" size="sm" className="h-7 rounded-full px-3 text-xs" asChild>
            <Link to="/app/premium">Débloquer</Link>
          </Button>
        </div>
      </div>
    )
  }

  const effectiveOnApply = onApply && (isPremium || canUseFreeAdvice) ? onApply : undefined
  const adjustDialog = effectiveOnApply ? (
    <OverloadAdjustDialog
      open={adjustOpen}
      onOpenChange={setAdjustOpen}
      suggestion={suggestion}
      onConfirm={handleApplySuggestion}
    />
  ) : null

  if (compact) {
    return (
      <>
        <div
          className={cn(
            'flex flex-col gap-2 rounded-xl bg-soft-accent/40 px-3 py-2',
            className,
          )}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <p className="text-xs leading-relaxed text-foreground">{suggestion.message}</p>
          <OverloadHintActions
            onApply={effectiveOnApply ? () => handleApplySuggestion(suggestion) : undefined}
            onAdjust={effectiveOnApply ? () => setAdjustOpen(true) : undefined}
            onDismiss={() => setDismissed(true)}
          />
        </div>
        {adjustDialog}
      </>
    )
  }

  const best = lastPerformance.bestSet
  const dateLabel = format(new Date(lastPerformance.date), 'd MMM yyyy', { locale: fr })

  return (
    <>
      <div className={cn('space-y-2 rounded-2xl bg-soft-secondary/50 p-3', className)}>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-secondary-foreground" />
          <p className="text-xs font-semibold text-foreground">
            Séance précédente ({dateLabel})
          </p>
        </div>
        <p className="font-data text-xs text-muted-foreground">
          {formatLastSessionReference(best)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="accent">{suggestion.message}</Pill>
          <OverloadHintActions
            onApply={effectiveOnApply ? () => handleApplySuggestion(suggestion) : undefined}
            onAdjust={effectiveOnApply ? () => setAdjustOpen(true) : undefined}
            onDismiss={() => setDismissed(true)}
          />
        </div>
      </div>
      {adjustDialog}
    </>
  )
}
