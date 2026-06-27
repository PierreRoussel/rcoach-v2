import { Check } from 'lucide-react'

import {
  PASSWORD_REQUIREMENTS,
  passwordIssueLabel,
  type PasswordValidationResult,
} from '@/lib/auth/password-policy'
import { cn } from '@/lib/utils'

type PasswordRequirementsListProps = {
  validation: PasswordValidationResult
  password: string
  compact?: boolean
}

export function PasswordRequirementsList({
  validation,
  password,
  compact = false,
}: PasswordRequirementsListProps) {
  return (
    <ul
      className={cn(
        'rounded-xl border border-border/70 bg-muted/30 text-xs',
        compact ? 'grid grid-cols-2 gap-x-2 gap-y-0.5 px-2.5 py-1.5 text-[11px]' : 'space-y-1 px-3 py-2',
      )}
    >
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = !validation.issues.includes(requirement)

        return (
          <li
            key={requirement}
            className={cn(
              'flex items-center gap-2',
              met ? 'text-secondary-foreground' : 'text-muted-foreground',
            )}
          >
            <Check className={cn('size-3.5 shrink-0', met ? 'opacity-100' : 'opacity-30')} />
            {passwordIssueLabel(requirement)}
          </li>
        )
      })}
    </ul>
  )
}
