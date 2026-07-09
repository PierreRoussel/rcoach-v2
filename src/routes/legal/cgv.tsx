import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { cgvDocument } from '@/content/legal/cgv'

export const Route = createFileRoute('/legal/cgv')({
  component: CgvPage,
})

function CgvPage() {
  return <LegalDocumentLayout document={cgvDocument} />
}
