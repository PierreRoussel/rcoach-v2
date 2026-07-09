import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { privacyPolicyDocument } from '@/content/legal/privacy'

export const Route = createFileRoute('/legal/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return <LegalDocumentLayout document={privacyPolicyDocument} />
}
