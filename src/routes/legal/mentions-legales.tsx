import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { legalNoticeDocument } from '@/content/legal/mentions'

export const Route = createFileRoute('/legal/mentions-legales')({
  component: MentionsLegalesPage,
})

function MentionsLegalesPage() {
  return <LegalDocumentLayout document={legalNoticeDocument} />
}
