export const MIN_PASSWORD_LENGTH = 8

export type PasswordValidationIssue =
  | 'too-short'
  | 'missing-letter'
  | 'missing-digit'
  | 'same-as-current'

export type PasswordValidationResult = {
  isValid: boolean
  issues: PasswordValidationIssue[]
}

export function validateNewPassword(
  password: string,
  currentPassword = '',
): PasswordValidationResult {
  const issues: PasswordValidationIssue[] = []

  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push('too-short')
  }

  if (!/[A-Za-z]/.test(password)) {
    issues.push('missing-letter')
  }

  if (!/\d/.test(password)) {
    issues.push('missing-digit')
  }

  if (currentPassword && password === currentPassword) {
    issues.push('same-as-current')
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

export function passwordIssueLabel(issue: PasswordValidationIssue): string {
  switch (issue) {
    case 'too-short':
      return `Au moins ${MIN_PASSWORD_LENGTH} caractères`
    case 'missing-letter':
      return 'Au moins une lettre'
    case 'missing-digit':
      return 'Au moins un chiffre'
    case 'same-as-current':
      return 'Différent du mot de passe actuel'
  }
}

export const PASSWORD_REQUIREMENTS: PasswordValidationIssue[] = [
  'too-short',
  'missing-letter',
  'missing-digit',
]
