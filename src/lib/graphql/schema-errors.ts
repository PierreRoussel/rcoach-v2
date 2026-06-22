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

const SCHEDULE_GRAPHQL_FIELDS = [
  'scheduled_sessions',
  'insert_scheduled_sessions_one',
  'update_scheduled_sessions_by_pk',
  'delete_scheduled_sessions_by_pk',
  'scheduled_sessions_insert_input',
  'scheduled_sessions_set_input',
] as const

export const SCHEDULE_NOT_DEPLOYED_MESSAGE =
  'La planification necessite le deploiement Nhost (migration scheduled_sessions).'

export function isGraphqlScheduleMissingError(error: unknown): boolean {
  return SCHEDULE_GRAPHQL_FIELDS.some((field) =>
    isGraphqlMissingFieldError(error, field),
  )
}

export function toScheduleDeployError(error: unknown): Error {
  if (isGraphqlScheduleMissingError(error)) {
    return new Error(SCHEDULE_NOT_DEPLOYED_MESSAGE)
  }

  return error instanceof Error ? error : new Error(String(error))
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
