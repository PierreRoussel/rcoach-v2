import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type AdminChartCardProps = {
  title: string
  description?: string
  tooltip: string
  icon?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export function AdminChartCard({
  title,
  description,
  tooltip,
  icon,
  children,
  contentClassName,
}: AdminChartCardProps) {
  return (
    <Card className="rounded-2xl border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="font-display font-black">{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`En savoir plus : ${title}`}
              >
                <Info className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="max-w-xs text-sm">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className={cn('h-72', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

type AdminChartSectionHeaderProps = {
  title: string
  description?: string
  tooltip: string
}

/** En-tête avec tooltip pour cartes non graphiques (tableaux analytiques). */
export function AdminChartSectionHeader({
  title,
  description,
  tooltip,
}: AdminChartSectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1.5">
        <CardTitle className="font-display font-black">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`En savoir plus : ${title}`}
          >
            <Info className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="end" className="max-w-xs text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
