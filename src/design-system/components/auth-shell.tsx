import { BrandLogo } from '@/design-system/components/brand-logo'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  children: React.ReactNode
  className?: string
}

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className="min-h-svh bg-gradient-hero">
      <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center p-4">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>
        <div className={cn('w-full', className)}>{children}</div>
      </div>
    </div>
  )
}
