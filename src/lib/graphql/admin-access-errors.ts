import { isGraphqlDatabaseError } from '@/lib/graphql/schema-errors'

const ADMIN_KPI_ACCESS_MESSAGE =
  'Accès admin refusé. Vérifiez que votre profil a role = admin en base (adapter l’UUID dans scripts/admin-promote-leo.sql), puis déployez la migration 1744500000000_fix_admin_kpi_functions et les metadata Hasura (workflow Deploy Nhost).'

export function toAdminKpiAccessError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error(ADMIN_KPI_ACCESS_MESSAGE)
  }

  if (
    error.message.toLowerCase().includes('forbidden') ||
    isGraphqlDatabaseError(error)
  ) {
    return new Error(ADMIN_KPI_ACCESS_MESSAGE)
  }

  return error
}
