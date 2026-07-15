import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Crown, CircleCheck, Lock, TrendingUp, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

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
  exercise: Pick<Exercise, 'id' | 'name' | 'equipment' | 'muscle_group'>
  bodyWeightKg?: number | null
  rpeEnabled?: boolean
  hidden?: boolean
  onApply?: (suggestion: OverloadSuggestion) => void
  onDismiss?: () => void
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

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setWeightValue(
        suggestion.suggestedWeightKg != null ? String(suggestion.suggestedWeightKg) : '',
      )
      setRepsValue(
        suggestion.suggestedReps != null ? String(suggestion.suggestedReps) : '',
      )
    }
    onOpenChange(nextOpen)
  }

  function handleConfirm() {
    onConfirm({
      ...suggestion,
      suggestedWeightKg: parseOptionalNumber(weightValue),
      suggestedReps: parseOptionalNumber(repsValue),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black">Ajuster la surcharge</DialogTitle>
          <DialogDescription>
            Modifiez la charge et les répétitions à appliquer aux séries de travail.
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

function DismissOnlyAction({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex justify-end">
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

function AdaptedLoadHint({
  onDismiss,
  className,
  compact = false,
}: {
  onDismiss: () => void
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border border-success/25 bg-success/5',
        compact ? 'px-3 py-2' : 'p-3',
        className,
      )}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">Charge adaptée</p>
      </div>
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
  rpeEnabled = false,
  hidden = false,
  onApply,
  onDismiss,
  compact = false,
  className,
  overloadGate,
}: ExerciseOverloadHintProps) {
  const { data: lastPerformance, isLoading } = useLastExercisePerformance(exercise.id)
  const [adjustOpen, setAdjustOpen] = useState(false)

  const suggestion = lastPerformance
    ? suggestProgressiveOverload(exercise, lastPerformance, {
        bodyWeightKg,
        rpeEnabled,
      })
    : null

  const isPremium = overloadGate?.isPremium ?? true
  const canUseFreeAdvice =
    !isPremium &&
    overloadGate?.isFreeExerciseOfDay === true &&
    overloadGate?.isFreeQuotaAvailable === true
  const isLocked = !isPremium && !canUseFreeAdvice

  function handleDismiss() {
    onDismiss?.()
  }

  function handleApplySuggestion(nextSuggestion: OverloadSuggestion) {
    if (!nextSuggestion.actionable) {
      return
    }
    onApply?.(nextSuggestion)
  }

  if (isWarmUpExerciseName(exercise.name) || hidden) {
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
    const showQuotaUsedMessage = overloadGate?.isFreeQuotaAvailable === false

    return (
      <div
        className={cn(
          'flex flex-col gap-2.5 rounded-xl border border-dashed border-primary/30 bg-soft-primary/15 px-3 py-3',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm">
            <Lock className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Pill tone="solid-primary" className="gap-1 text-[10px]">
              <Crown className="size-3" aria-hidden />
              Premium
            </Pill>
            {showQuotaUsedMessage ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Conseil gratuit du jour déjà utilisé.
              </p>
            ) : null}
          </div>
        </div>
        <Button variant="soft" size="sm" className="h-8 w-full rounded-full text-xs" asChild>
          <Link to="/app/premium">Découvrir Premium</Link>
        </Button>
      </div>
    )
  }

  const isInfoOnly = !suggestion.actionable
  const effectiveOnApply =
    onApply && suggestion.actionable && (isPremium || canUseFreeAdvice) ? onApply : undefined
  const adjustDialog = effectiveOnApply ? (
    <OverloadAdjustDialog
      open={adjustOpen}
      onOpenChange={setAdjustOpen}
      suggestion={suggestion}
      onConfirm={handleApplySuggestion}
    />
  ) : null

  if (suggestion.adaptedLoad) {
    return <AdaptedLoadHint onDismiss={handleDismiss} className={className} compact={compact} />
  }

  if (compact) {
    return (
      <>
        <div
          className={cn(
            'flex flex-col gap-2 rounded-xl px-3 py-2',
            isInfoOnly
              ? 'border border-border bg-muted/40'
              : 'bg-soft-accent/40',
            className,
          )}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <p className="text-xs leading-relaxed text-foreground">{suggestion.message}</p>
          {!isInfoOnly ? (
            <p className="text-[10px] text-muted-foreground">
              Appliqué aux séries de travail uniquement.
            </p>
          ) : null}
          {isInfoOnly ? (
            <DismissOnlyAction onDismiss={handleDismiss} />
          ) : (
            <OverloadHintActions
              onApply={effectiveOnApply ? () => handleApplySuggestion(suggestion) : undefined}
              onAdjust={effectiveOnApply ? () => setAdjustOpen(true) : undefined}
              onDismiss={handleDismiss}
            />
          )}
        </div>
        {adjustDialog}
      </>
    )
  }

  const referenceSet = lastPerformance.bestSet
  const dateLabel = format(new Date(lastPerformance.date), 'd MMM yyyy', { locale: fr })

  return (
    <>
      <div
        className={cn(
          'space-y-2 rounded-2xl p-3',
          isInfoOnly ? 'border border-border bg-muted/40' : 'bg-soft-secondary/50',
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-secondary-foreground" />
          <p className="text-xs font-semibold text-foreground">
            Séance précédente ({dateLabel})
          </p>
        </div>
        <p className="font-data text-xs text-muted-foreground">
          {formatLastSessionReference(referenceSet)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={isInfoOnly ? 'secondary' : 'accent'}>{suggestion.message}</Pill>
          {isInfoOnly ? (
            <DismissOnlyAction onDismiss={handleDismiss} />
          ) : (
            <OverloadHintActions
              onApply={effectiveOnApply ? () => handleApplySuggestion(suggestion) : undefined}
              onAdjust={effectiveOnApply ? () => setAdjustOpen(true) : undefined}
              onDismiss={handleDismiss}
            />
          )}
        </div>
        {!isInfoOnly ? (
          <p className="text-[10px] text-muted-foreground">
            Appliqué aux séries de travail uniquement.
          </p>
        ) : null}
      </div>
      {adjustDialog}
    </>
  )
}
