import { createFileRoute } from '@tanstack/react-router'

import { ThematicMarketingView } from '@/components/marketing/ThematicMarketingView'
import { NUTRITION_PAGE } from '@/content/marketing/pages'
import { PAGE_FEATURE_GROUPS } from '@/content/marketing/features-catalog'

export const Route = createFileRoute('/_marketing/application-nutrition')({
  component: NutritionPage,
})

function NutritionPage() {
  return (
    <ThematicMarketingView
      page={NUTRITION_PAGE}
      primaryFeatureIds={PAGE_FEATURE_GROUPS.nutrition.free}
      premiumFeatureIds={PAGE_FEATURE_GROUPS.nutrition.premium}
      primarySectionTitle="Nutrition au quotidien, sans friction"
      primarySectionDescription="Journal, macros, scan et streaks pour tenir vos objectifs alimentaires."
      premiumSectionTitle="Premium nutrition & objectifs"
      premiumSectionDescription="Conseils nutrition personnalisés, projection de date et coaching anti-stagnation."
      heroVariant="centered"
    />
  )
}
