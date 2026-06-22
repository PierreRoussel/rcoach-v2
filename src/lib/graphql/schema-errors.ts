export function isGraphqlMissingFieldError(
  error: unknown,
  fieldName: string,
): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes(`'${fieldName}'`) &&
    error.message.includes('not found')
  )
}

export function stripNullishFields<T extends Record<string, unknown>>(
  object: T,
  keys: Array<keyof T>,
): T {
  const next = { ...object }

  for (const key of keys) {
    if (next[key] == null) {
      delete next[key]
    }
  }

  return next
}
