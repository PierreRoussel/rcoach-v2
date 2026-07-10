import { createFileRoute } from '@tanstack/react-router'

import { MarketingPageView } from '@/components/marketing/MarketingPageView'
import { NUTRITION_PAGE } from '@/content/marketing/pages'

export const Route = createFileRoute('/_marketing/application-nutrition')({
  component: NutritionPage,
})

function NutritionPage() {
  return <MarketingPageView page={NUTRITION_PAGE} />
}
