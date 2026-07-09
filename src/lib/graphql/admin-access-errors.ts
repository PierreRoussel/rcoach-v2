import { isGraphqlDatabaseError } from '@/lib/graphql/schema-errors'

const ADMIN_KPI_ACCESS_MESSAGE =
  'Les fonctions admin ne lisent pas votre id dans le JWT. Déployez les migrations 174450–174471 (ou exécutez scripts/hotfix-admin-jwt.sql dans Hasura → SQL), puis reconnectez-vous.'

const ADMIN_KPI_FORBIDDEN_MESSAGE =
  'Accès admin refusé par la base (forbidden). Déployez les migrations 174450 et 174470 si ce n’est pas fait, reconnectez-vous, puis vérifiez profiles.role = admin.'

export function toAdminKpiAccessError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error(ADMIN_KPI_ACCESS_MESSAGE)
  }

  if (error.message.toLowerCase().includes('forbidden')) {
    return new Error(ADMIN_KPI_FORBIDDEN_MESSAGE)
  }

  if (isGraphqlDatabaseError(error)) {
    return new Error(ADMIN_KPI_ACCESS_MESSAGE)
  }

  return error
}
