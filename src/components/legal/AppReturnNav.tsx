import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { useOpenedFromAppShell } from '@/hooks/useOpenedFromAppShell'
import { cn } from '@/lib/utils'

type AppReturnNavProps = {
  className?: string
}

export function AppReturnNav({ className }: AppReturnNavProps) {
  const fromApp = useOpenedFromAppShell()

  if (!fromApp) {
    return null
  }

  return (
    <Link
      to="/app/profile"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline',
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Retour à l&apos;app
    </Link>
  )
}
