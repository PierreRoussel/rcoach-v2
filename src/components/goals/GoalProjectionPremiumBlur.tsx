import { Link } from '@tanstack/react-router'
import { Crown, Lock } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pill } from '@/design-system'
import { cn } from '@/lib/utils'

type GoalProjectionPremiumBlurProps = {
  entitled: boolean
  children: ReactNode
  className?: string
  /** Affiche un bouton CTA sous le contenu flouté (carte Projection). */
  showPremiumCta?: boolean
  /** Texte compact pour la tuile homepage. */
  variant?: 'inline' | 'block'
}

function GoalProjectionPremiumDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black">
            Projection de fin d&apos;objectif
          </DialogTitle>
          <DialogDescription>
            Le plan Gratuit permet de suivre votre progression, mais pas d&apos;estimer une
            date d&apos;arrivée. Passez en Premium pour débloquer la projection complète.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="pill" className="w-full" asChild>
            <Link to="/app/premium">Voir les abonnements</Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function GoalProjectionPremiumBlur({
  entitled,
  children,
  className,
  showPremiumCta = false,
  variant = 'block',
}: GoalProjectionPremiumBlurProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isInline = variant === 'inline'

  if (entitled) {
    return <>{children}</>
  }

  function openDialog() {
    setDialogOpen(true)
  }

  return (
    <>
      <div className={cn(!isInline && 'space-y-3', className)}>
        <button
          type="button"
          className={cn(
            'group relative text-left',
            isInline ? 'inline-block max-w-full shrink-0' : 'w-full rounded-xl',
          )}
          onClick={openDialog}
          aria-label="Débloquer la projection Premium"
        >
          <div
            className={cn(
              'pointer-events-none select-none blur-md opacity-50',
              isInline && 'whitespace-nowrap',
            )}
          >
            {children}
          </div>
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-1.5',
              isInline && 'px-1',
            )}
          >
            <Pill tone="solid-primary" className="gap-1 text-[10px] shadow-sm">
              <Lock className="size-3" aria-hidden />
              {!isInline ? 'Premium' : null}
            </Pill>
          </span>
        </button>
        {showPremiumCta ? (
          <Button variant="pill" className="w-full gap-2" onClick={openDialog}>
            <Crown className="size-4" aria-hidden />
            Débloquer la projection
          </Button>
        ) : null}
      </div>
      <GoalProjectionPremiumDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
