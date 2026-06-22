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

export function isGraphqlDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  return (
    message.includes('database query error') ||
    message.includes('not-null violation') ||
    message.includes('constraint-violation') ||
    message.includes('foreign key violation') ||
    message.includes('does not exist')
  )
}

export function toTemplateDeployError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Impossible d enregistrer le modele.')
  }

  if (isGraphqlDatabaseError(error)) {
    return new Error(
      `${error.message} — Verifiez que les migrations Nhost (workout_templates, workout_template_sets) sont deployees.`,
    )
  }

  return error
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
