import { Link } from '@tanstack/react-router'
import { Crown, Lock } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pill } from '@/design-system'
import { cn } from '@/lib/utils'

type UpgradePromptProps = {
  title: string
  description: string
  className?: string
}

export function UpgradePrompt({ title, description, className }: UpgradePromptProps) {
  return (
    <Card className={cn('rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Pill tone="solid-primary">Premium</Pill>
          <Crown className="size-4 text-primary" aria-hidden />
        </div>
        <CardTitle className="font-display font-black">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="pill" className="w-full" asChild>
          <Link to="/app/premium">Découvrir Premium</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

type PremiumGateProps = {
  entitled: boolean
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function PremiumGate({
  entitled,
  title,
  description,
  children,
  className,
}: PremiumGateProps) {
  if (entitled) {
    return <>{children}</>
  }

  return (
    <div className={cn('relative', className)}>
      <div className="pointer-events-none select-none blur-[1px] opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-2xl border-border bg-card/95 shadow-lg backdrop-blur-sm">
          <CardContent className="space-y-3 p-4 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-soft-primary text-primary">
              <Lock className="size-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-display font-black text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button variant="pill" className="w-full" asChild>
              <Link to="/app/premium">Passer en Premium</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
