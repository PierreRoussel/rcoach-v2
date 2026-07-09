export type SupportRequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type AdminSupportRequest = {
  id: string
  userId: string
  displayName: string
  subject: string
  message: string
  status: SupportRequestStatus
  createdAt: string
  updatedAt: string
}

export type AdminSupportRequests = {
  requests: AdminSupportRequest[]
  limit: number
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asSupportRequestStatus(value: unknown): SupportRequestStatus {
  if (
    value === 'open' ||
    value === 'in_progress' ||
    value === 'resolved' ||
    value === 'closed'
  ) {
    return value
  }

  return 'open'
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function parseAdminSupportRequests(value: unknown): AdminSupportRequests {
  const payload = (value ?? {}) as Partial<AdminSupportRequests>

  return {
    requests: Array.isArray(payload.requests)
      ? payload.requests.map((row) => ({
          id: asString((row as AdminSupportRequest)?.id),
          userId: asString((row as AdminSupportRequest)?.userId),
          displayName: asString((row as AdminSupportRequest)?.displayName, 'Sans nom'),
          subject: asString((row as AdminSupportRequest)?.subject),
          message: asString((row as AdminSupportRequest)?.message),
          status: asSupportRequestStatus((row as AdminSupportRequest)?.status),
          createdAt: asString((row as AdminSupportRequest)?.createdAt),
          updatedAt: asString((row as AdminSupportRequest)?.updatedAt),
        }))
      : [],
    limit: asNumber(payload.limit, 50),
  }
}
