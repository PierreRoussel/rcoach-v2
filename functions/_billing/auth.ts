type FunctionRequest = {
  method: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

export function readBearerToken(headers: FunctionRequest['headers']): string | null {
  const raw = headers.authorization ?? headers.Authorization
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value?.startsWith('Bearer ')) {
    return null
  }

  return value.slice('Bearer '.length).trim()
}

export function readJsonBody<T>(body: unknown): T | null {
  const payload =
    typeof body === 'string'
      ? (() => {
          try {
            return JSON.parse(body) as unknown
          } catch {
            return null
          }
        })()
      : body

  if (!payload || typeof payload !== 'object') {
    return null
  }

  return payload as T
}

export async function readUserIdFromAccessToken(accessToken: string): Promise<string | null> {
  const parts = accessToken.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>

    const hasuraClaims = payload['https://hasura.io/jwt/claims'] as
      | Record<string, string>
      | undefined

    return hasuraClaims?.['x-hasura-user-id'] ?? (typeof payload.sub === 'string' ? payload.sub : null)
  } catch {
    return null
  }
}
