import type { NhostClient } from '@nhost/nhost-js'

import { RECORD_LEGAL_CONSENT } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'

function isRecordLegalConsentMissingError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('record_legal_consent') &&
    (message.includes('query_root') || message.includes('not found'))
  )
}

function isRecordLegalConsentAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('not authenticated') ||
    message.includes('database query error')
  )
}

/** Records CGU + privacy acceptance timestamps (idempotent). */
export async function recordLegalConsent(nhost: NhostClient) {
  try {
    await graphqlRequest<{ record_legal_consent: { value: string } }>(
      nhost,
      RECORD_LEGAL_CONSENT,
    )
  } catch (error) {
    if (isRecordLegalConsentMissingError(error)) {
      return
    }

    // Backend not migrated yet (request_hasura_user_id) — do not block login.
    if (isRecordLegalConsentAuthError(error)) {
      if (import.meta.env.DEV) {
        console.warn(
          '[legal] record_legal_consent failed — deploy migration 1744700000000_fix_hasura_jwt_user_id',
          error,
        )
      }
      return
    }

    throw error
  }
}
