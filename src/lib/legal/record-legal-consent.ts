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

/** Records CGU + privacy acceptance timestamps (idempotent). */
export async function recordLegalConsent(nhost: NhostClient) {
  try {
    await graphqlRequest<{ record_legal_consent: string }>(nhost, RECORD_LEGAL_CONSENT)
  } catch (error) {
    if (isRecordLegalConsentMissingError(error)) {
      return
    }

    throw error
  }
}
