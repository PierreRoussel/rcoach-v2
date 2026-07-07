import { createFileRoute } from '@tanstack/react-router'

import { PremiumOfferPage } from '@/components/premium/PremiumOfferPage'

export const Route = createFileRoute('/app/premium/')({
  component: AppPremiumPage,
})

function AppPremiumPage() {
  return <PremiumOfferPage />
}
