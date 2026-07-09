import { isGraphqlDatabaseError } from '@/lib/graphql/schema-errors'

const ADMIN_KPI_ACCESS_MESSAGE =
  'Les fonctions admin ne reconnaissent pas votre session (JWT Hasura). Déployez les migrations 1744500000000_fix_admin_kpi_functions et 1744700000000_fix_hasura_jwt_user_id, puis relancez Deploy Nhost. Votre rôle admin en base est correct si profiles.role = admin.'

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
