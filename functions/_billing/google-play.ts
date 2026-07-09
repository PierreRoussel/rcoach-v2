import { createSign } from 'node:crypto'

import { readPlayPackageName } from './subscription.ts'

type ServiceAccount = {
  client_email: string
  private_key: string
}

function readServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) {
    throw new Error('Missing GOOGLE_PLAY_SERVICE_ACCOUNT_JSON.')
  }

  const parsed = JSON.parse(raw) as ServiceAccount
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Invalid Google Play service account JSON.')
  }

  return parsed
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccount = readServiceAccount()
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )

  const unsigned = `${header}.${payload}`
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .sign(serviceAccount.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const assertion = `${unsigned}.${signature}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  const body = (await response.json()) as { access_token?: string; error?: string }
  if (!response.ok || !body.access_token) {
    throw new Error(body.error ?? 'Unable to authenticate with Google Play.')
  }

  return body.access_token
}

export async function verifyPlaySubscription(input: {
  productId: string
  purchaseToken: string
}): Promise<{
  expiryTimeMillis: string | null
  paymentState: number | null
  acknowledgementState: number | null
}> {
  const accessToken = await getGoogleAccessToken()
  const packageName = readPlayPackageName()
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${input.productId}/tokens/${encodeURIComponent(input.purchaseToken)}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const payload = (await response.json()) as {
    expiryTimeMillis?: string
    paymentState?: number
    acknowledgementState?: number
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Google Play verify failed (${response.status}).`)
  }

  return {
    expiryTimeMillis: payload.expiryTimeMillis ?? null,
    paymentState: payload.paymentState ?? null,
    acknowledgementState: payload.acknowledgementState ?? null,
  }
}

export async function acknowledgePlaySubscription(input: {
  productId: string
  purchaseToken: string
}): Promise<void> {
  const accessToken = await getGoogleAccessToken()
  const packageName = readPlayPackageName()
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${input.productId}/tokens/${encodeURIComponent(input.purchaseToken)}:acknowledge`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null
    throw new Error(payload?.error?.message ?? `Google Play acknowledge failed (${response.status}).`)
  }
}
