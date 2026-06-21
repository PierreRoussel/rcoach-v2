import * as React from 'react'

import { cn } from '@/lib/utils'

function FormField({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-2', className)} {...props} />
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    />
  )
}

export { FormField, FormMessage }
