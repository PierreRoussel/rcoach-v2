import { cn } from '@/lib/utils'

const LOGO_SRC = '/logo.png'

type BrandLogoProps = {
  compact?: boolean
  className?: string
  imageClassName?: string
}

export function BrandLogo({ compact = false, className, imageClassName }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src={LOGO_SRC}
        alt="RCoach"
        width={32}
        height={32}
        className={cn('size-8 shrink-0 rounded-xl object-cover', imageClassName)}
      />
      {!compact ? (
        <div>
          <div className="font-display text-base leading-none font-black text-foreground">
            RCoach
          </div>
          <div className="font-data text-[10px] tracking-widest text-muted-foreground uppercase">
            Sport & nutrition
          </div>
        </div>
      ) : null}
    </div>
  )
}
