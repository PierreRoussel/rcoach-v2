import { createFileRoute } from '@tanstack/react-router'

import { FeaturesMarketingView } from '@/components/marketing/FeaturesMarketingView'

export const Route = createFileRoute('/_marketing/fonctionnalites')({
  component: FeaturesPage,
})

function FeaturesPage() {
  return <FeaturesMarketingView />
}
