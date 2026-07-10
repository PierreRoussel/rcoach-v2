import { createFileRoute } from '@tanstack/react-router'

import { MarketingPageView } from '@/components/marketing/MarketingPageView'
import { PricingTable } from '@/components/marketing/PricingTable'
import { PRICING_PAGE } from '@/content/marketing/pages'

export const Route = createFileRoute('/_marketing/tarifs')({
  component: PricingPage,
})

function PricingPage() {
  return <MarketingPageView page={PRICING_PAGE} extraSections={<PricingTable />} />
}
