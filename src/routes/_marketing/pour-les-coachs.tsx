import { createFileRoute } from '@tanstack/react-router'

import { MarketingPageView } from '@/components/marketing/MarketingPageView'
import { COACH_PAGE } from '@/content/marketing/pages'

export const Route = createFileRoute('/_marketing/pour-les-coachs')({
  component: CoachMarketingPage,
})

function CoachMarketingPage() {
  return <MarketingPageView page={COACH_PAGE} />
}
