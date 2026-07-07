import { addWeeks, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Activity,
  BarChart3,
  Lightbulb,
  Target,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { Pill } from '@/design-system'
import { cn } from '@/lib/utils'

function MockupFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function OverloadAdviceMockup({ className }: { className?: string }) {
  return (
    <MockupFrame className={className}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-soft-primary text-primary">
          <TrendingUp className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold text-foreground">Développé couché</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Dernière séance : 50 kg × 8 reps. Essayez{' '}
            <span className="font-semibold text-foreground">52,5 kg</span> pour 8 reps.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Pill tone="solid-primary" className="text-[10px]">
              Appliquer 52,5 kg
            </Pill>
            <Pill tone="secondary" className="text-[10px]">
              8 reps
            </Pill>
          </div>
        </div>
      </div>
    </MockupFrame>
  )
}

export function DetailedStatsMockup({ className }: { className?: string }) {
  return (
    <MockupFrame className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-soft-primary/50 px-2.5 py-2 text-center">
          <p className="font-display text-lg font-black text-primary">24</p>
          <p className="text-[10px] text-muted-foreground">Séances</p>
        </div>
        <div className="rounded-xl bg-soft-secondary/60 px-2.5 py-2 text-center">
          <p className="font-display text-lg font-black text-secondary-foreground">12,4k</p>
          <p className="text-[10px] text-muted-foreground">Volume kg</p>
        </div>
      </div>
      <div className="flex h-20 items-end justify-between gap-1.5 px-1">
        {[42, 58, 48, 72, 65, 80].map((height, index) => (
          <div
            key={index}
            className="w-full rounded-t-md bg-primary/70"
            style={{ height: `${height}%` }}
            aria-hidden
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <BarChart3 className="size-3.5 text-primary" aria-hidden />
        Heatmap & progression par exercice
      </div>
    </MockupFrame>
  )
}

export function GoalProjectionMockup({ className }: { className?: string }) {
  const projectedDate = addWeeks(new Date(), 10)

  return (
    <MockupFrame className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Target className="size-4 text-emerald-600" aria-hidden />
        <p className="text-xs font-semibold text-foreground">Projection objectif poids</p>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <p className="text-muted-foreground">
          Rythme estimé :{' '}
          <span className="font-semibold text-foreground">0,4 kg/semaine</span>
        </p>
        <p>
          Arrivée estimée :{' '}
          <span className="font-semibold text-primary">
            {format(projectedDate, 'd MMMM yyyy', { locale: fr })}
          </span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-emerald-500 to-primary" />
      </div>
      <p className="text-center text-[10px] text-muted-foreground">78,2 kg → 74,0 kg</p>
    </MockupFrame>
  )
}

export function NutritionHintMockup({ className }: { className?: string }) {
  return (
    <MockupFrame className={className}>
      <div className="flex items-start gap-2.5">
        <Lightbulb className="size-5 shrink-0 text-amber-500" aria-hidden />
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground">Conseil du jour</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Tu es un peu bas en protéines (68 g vs 120 g visés). Un skyr ou des lentilles au
            déjeuner peuvent combler l&apos;écart facilement.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Activity className="size-3.5" aria-hidden />
        Basé sur tes 3 derniers jours journalisés
      </div>
    </MockupFrame>
  )
}
