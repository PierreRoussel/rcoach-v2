import { Zap } from 'lucide-react'

import { cn } from '@/lib/utils'

type BrandLogoProps = {
  compact?: boolean
  className?: string
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
        <Zap className="size-4 fill-white text-white" />
      </div>
      {!compact ? (
        <div>
          <div className="font-display text-base leading-none font-black text-foreground">
            RCoach
          </div>
          <div className="font-data text-[10px] tracking-widest text-muted-foreground uppercase">
            Sport PWA
          </div>
        </div>
      ) : null}
    </div>
  )
}
