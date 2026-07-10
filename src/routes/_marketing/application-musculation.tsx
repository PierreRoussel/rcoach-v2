import { createFileRoute } from '@tanstack/react-router'

import { MarketingPageView } from '@/components/marketing/MarketingPageView'
import { MUSCULATION_PAGE } from '@/content/marketing/pages'

export const Route = createFileRoute('/_marketing/application-musculation')({
  component: MusculationPage,
})

function MusculationPage() {
  return <MarketingPageView page={MUSCULATION_PAGE} />
}
