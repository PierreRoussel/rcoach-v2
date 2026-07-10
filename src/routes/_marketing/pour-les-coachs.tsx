import { createFileRoute } from '@tanstack/react-router'

import { ThematicMarketingView } from '@/components/marketing/ThematicMarketingView'
import { COACH_PAGE } from '@/content/marketing/pages'
import { PAGE_FEATURE_IDS } from '@/content/marketing/features-catalog'

export const Route = createFileRoute('/_marketing/pour-les-coachs')({
  component: CoachMarketingPage,
})

function CoachMarketingPage() {
  return (
    <ThematicMarketingView
      page={COACH_PAGE}
      primaryFeatureIds={PAGE_FEATURE_IDS.coach}
      primarySectionTitle="Un ERP léger pour les coachs sportifs"
      primarySectionDescription="Clients, programmes et analytics — les données que vos athlètes saisissent dans RCoach, centralisées pour vous."
      showFreePremium={false}
      heroVariant="centered"
    />
  )
}
