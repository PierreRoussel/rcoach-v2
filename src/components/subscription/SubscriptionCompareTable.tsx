import { Check, X } from 'lucide-react'

import { COMPARE_FEATURES } from '@/lib/subscription/plans'
import { cn } from '@/lib/utils'

export function SubscriptionCompareTable({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border', className)}>
      <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
        <span>Fonctionnalité</span>
        <span className="text-center">Gratuit</span>
        <span className="text-center text-primary">Premium</span>
      </div>
      {COMPARE_FEATURES.map((feature) => (
        <div
          key={feature.id}
          className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center border-t border-border px-3 py-2.5 text-sm"
        >
          <span className="text-foreground">{feature.label}</span>
          <CompareCell value={feature.free} />
          <CompareCell value={feature.premium} premium />
        </div>
      ))}
    </div>
  )
}

function CompareCell({
  value,
  premium = false,
}: {
  value: boolean | string
  premium?: boolean
}) {
  if (typeof value === 'string') {
    return (
      <span
        className={cn(
          'text-center text-xs font-medium',
          premium ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {value}
      </span>
    )
  }

  return (
    <span className="flex justify-center">
      {value ? (
        <Check className={cn('size-4', premium ? 'text-primary' : 'text-muted-foreground')} />
      ) : (
        <X className="size-4 text-muted-foreground/60" />
      )}
    </span>
  )
}
