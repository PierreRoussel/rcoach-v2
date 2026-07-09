import { Link } from '@tanstack/react-router'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { LEGAL_PATHS } from '@/lib/legal/config'

type RegisterLegalConsentFieldProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function RegisterLegalConsentField({
  checked,
  onCheckedChange,
}: RegisterLegalConsentFieldProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/50 px-3 py-3">
      <Checkbox
        id="legalConsent"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <Label htmlFor="legalConsent" className="text-xs leading-relaxed font-normal text-muted-foreground">
        J&apos;accepte les{' '}
        <Link to={LEGAL_PATHS.terms} className="font-medium text-primary underline-offset-2 hover:underline">
          CGU
        </Link>{' '}
        et la{' '}
        <Link
          to={LEGAL_PATHS.privacy}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          politique de confidentialité
        </Link>
        .
      </Label>
    </div>
  )
}
