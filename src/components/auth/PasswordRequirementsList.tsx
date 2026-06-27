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
}

export function PasswordRequirementsList({
  validation,
  password,
}: PasswordRequirementsListProps) {
  return (
    <ul className="space-y-1 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs">
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
