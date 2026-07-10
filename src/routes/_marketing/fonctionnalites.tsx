import { createFileRoute } from '@tanstack/react-router'

import { MarketingPageView } from '@/components/marketing/MarketingPageView'
import { FEATURES_PAGE } from '@/content/marketing/pages'

export const Route = createFileRoute('/_marketing/fonctionnalites')({
  component: FeaturesPage,
})

function FeaturesPage() {
  return <MarketingPageView page={FEATURES_PAGE} />
}
