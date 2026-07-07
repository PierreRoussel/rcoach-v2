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

const MOCKUP_TITLE = 'text-[#2c2545]'
const MOCKUP_BODY = 'text-[#5c5278]'
const MOCKUP_PRIMARY = 'text-[#c45f84]'
const MOCKUP_PRIMARY_BG = 'bg-[#f3e4eb]'
const MOCKUP_SECONDARY_BG = 'bg-[#e3f4ed]'
const MOCKUP_SECONDARY_TEXT = 'text-[#1a3d30]'

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
        'w-full rounded-2xl border border-[#e8e0f0] bg-white p-4 shadow-[0_12px_40px_rgba(44,37,69,0.1)]',
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
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            MOCKUP_PRIMARY_BG,
            MOCKUP_PRIMARY,
          )}
        >
          <TrendingUp className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className={cn('text-xs font-semibold', MOCKUP_TITLE)}>Développé couché</p>
          <p className={cn('text-[11px] leading-relaxed', MOCKUP_BODY)}>
            Dernière séance : 50 kg × 8 reps. Essayez{' '}
            <span className={cn('font-bold', MOCKUP_TITLE)}>52,5 kg</span> pour 8 reps.
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
        <div className={cn('rounded-xl px-2.5 py-2 text-center', MOCKUP_PRIMARY_BG)}>
          <p className={cn('font-display text-lg font-black', MOCKUP_PRIMARY)}>24</p>
          <p className={cn('text-[10px]', MOCKUP_BODY)}>Séances</p>
        </div>
        <div className={cn('rounded-xl px-2.5 py-2 text-center', MOCKUP_SECONDARY_BG)}>
          <p className={cn('font-display text-lg font-black', MOCKUP_SECONDARY_TEXT)}>12,4k</p>
          <p className={cn('text-[10px]', MOCKUP_BODY)}>Volume kg</p>
        </div>
      </div>
      <div className="flex h-20 items-end justify-between gap-1.5 px-1">
        {[42, 58, 48, 72, 65, 80].map((height, index) => (
          <div
            key={index}
            className="w-full rounded-t-md bg-[#d4789a]"
            style={{ height: `${height}%` }}
            aria-hidden
          />
        ))}
      </div>
      <div className={cn('flex items-center justify-center gap-1.5 text-[10px]', MOCKUP_BODY)}>
        <BarChart3 className={cn('size-3.5', MOCKUP_PRIMARY)} aria-hidden />
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
        <Target className="size-4 text-emerald-700" aria-hidden />
        <p className={cn('text-xs font-semibold', MOCKUP_TITLE)}>Projection objectif poids</p>
      </div>
      <div className={cn('space-y-1.5 text-[11px]', MOCKUP_BODY)}>
        <p>
          Rythme estimé :{' '}
          <span className={cn('font-semibold', MOCKUP_TITLE)}>0,4 kg/semaine</span>
        </p>
        <p>
          Arrivée estimée :{' '}
          <span className={cn('font-semibold', MOCKUP_PRIMARY)}>
            {format(projectedDate, 'd MMMM yyyy', { locale: fr })}
          </span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#ede9f7]">
        <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-emerald-600 to-[#d4789a]" />
      </div>
      <p className={cn('text-center text-[10px]', MOCKUP_BODY)}>78,2 kg → 74,0 kg</p>
    </MockupFrame>
  )
}

export function NutritionHintMockup({ className }: { className?: string }) {
  return (
    <MockupFrame className={className}>
      <div className="flex items-start gap-2.5">
        <Lightbulb className="size-5 shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1.5">
          <p className={cn('text-xs font-semibold', MOCKUP_TITLE)}>Conseil du jour</p>
          <p className={cn('text-[11px] leading-relaxed', MOCKUP_BODY)}>
            Tu es un peu bas en protéines (68 g vs 120 g visés). Un skyr ou des lentilles au
            déjeuner peuvent combler l&apos;écart facilement.
          </p>
        </div>
      </div>
      <div className={cn('mt-3 flex items-center gap-1.5 text-[10px]', MOCKUP_BODY)}>
        <Activity className="size-3.5" aria-hidden />
        Basé sur tes 3 derniers jours journalisés
      </div>
    </MockupFrame>
  )
}
