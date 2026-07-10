import { createFileRoute } from '@tanstack/react-router'

import { PricingMarketingView } from '@/components/marketing/PricingMarketingView'

export const Route = createFileRoute('/_marketing/tarifs')({
  component: PricingPage,
})

function PricingPage() {
  return <PricingMarketingView />
}
