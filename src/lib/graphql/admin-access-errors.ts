export function toAdminKpiAccessError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error('Impossible de charger les données admin.')
}
