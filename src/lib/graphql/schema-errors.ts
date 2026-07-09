export function isGraphqlMissingFieldError(
  error: unknown,
  fieldName: string,
): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message

  return (
    message.includes(`field '${fieldName}' not found in type:`) ||
    message.includes(`type '${fieldName}' not found`)
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
    return new Error("Impossible d'enregistrer le modèle.")
  }

  if (isGraphqlDatabaseError(error)) {
    return new Error(
      `${error.message} — Vérifiez que les migrations Nhost (workout_templates, workout_template_sets) sont déployées.`,
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
  'La planification nécessite le déploiement Nhost (migration scheduled_sessions).'

export function isGraphqlScheduleMissingError(error: unknown): boolean {
  return SCHEDULE_GRAPHQL_FIELDS.some((field) =>
    isGraphqlMissingFieldError(error, field),
  )
}

const SUBSCRIPTION_GRAPHQL_FIELDS = [
  'subscriptions',
  'insert_subscriptions_one',
  'update_subscriptions_by_pk',
  'subscriptions_insert_input',
  'subscriptions_set_input',
  'reconcile_my_subscription',
  'start_my_premium_trial',
  'cancel_my_subscription',
] as const

const SUBSCRIPTION_CANCELLATION_FEEDBACK_FIELDS = [
  'subscription_cancellation_feedback',
  'insert_subscription_cancellation_feedback_one',
  'subscription_cancellation_feedback_insert_input',
] as const

export const SUBSCRIPTION_NOT_DEPLOYED_MESSAGE =
  'Les abonnements nécessitent le déploiement Nhost (migrations subscriptions).'

export function isGraphqlSubscriptionMissingError(error: unknown): boolean {
  return SUBSCRIPTION_GRAPHQL_FIELDS.some((field) =>
    isGraphqlMissingFieldError(error, field),
  )
}

export function isGraphqlCancellationFeedbackMissingError(error: unknown): boolean {
  return SUBSCRIPTION_CANCELLATION_FEEDBACK_FIELDS.some((field) =>
    isGraphqlMissingFieldError(error, field),
  )
}

const ONBOARDING_GRAPHQL_FIELDS = [
  'complete_my_onboarding',
  'onboarding_completed_at',
  'profiles_set_input',
] as const

export const ONBOARDING_NOT_DEPLOYED_MESSAGE =
  'Impossible de finaliser l\'onboarding : déployez les metadata Nhost (complete_my_onboarding), puis réessayez dans quelques minutes.'

export function isGraphqlOnboardingMissingError(error: unknown): boolean {
  return ONBOARDING_GRAPHQL_FIELDS.some((field) =>
    isGraphqlMissingFieldError(error, field),
  )
}

export function toOnboardingDeployError(error: unknown): Error {
  if (isGraphqlOnboardingMissingError(error)) {
    return new Error(ONBOARDING_NOT_DEPLOYED_MESSAGE)
  }

  return error instanceof Error ? error : new Error(String(error))
}

export function toSubscriptionDeployError(error: unknown): Error {
  if (isGraphqlSubscriptionMissingError(error)) {
    return new Error(SUBSCRIPTION_NOT_DEPLOYED_MESSAGE)
  }

  if (error instanceof Error && isGraphqlDatabaseError(error)) {
    return new Error(
      `${error.message} — Vérifiez que les migrations Nhost (subscriptions) sont déployées.`,
    )
  }

  return error instanceof Error ? error : new Error(String(error))
}

export function toScheduleDeployError(error: unknown): Error {
  if (isGraphqlScheduleMissingError(error)) {
    return new Error(SCHEDULE_NOT_DEPLOYED_MESSAGE)
  }

  if (error instanceof Error && isGraphqlDatabaseError(error)) {
    return new Error(
      `${error.message} — Vérifiez les champs envoyés (récurrence, jours, dates).`,
    )
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
