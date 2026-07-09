import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { termsDocument } from '@/content/legal/terms'

export const Route = createFileRoute('/legal/terms')({
  component: TermsPage,
})

function TermsPage() {
  return <LegalDocumentLayout document={termsDocument} />
}
