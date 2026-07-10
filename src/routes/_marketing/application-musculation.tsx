import { createFileRoute } from '@tanstack/react-router'

import { ThematicMarketingView } from '@/components/marketing/ThematicMarketingView'
import { MUSCULATION_PAGE } from '@/content/marketing/pages'
import { PAGE_FEATURE_GROUPS } from '@/content/marketing/features-catalog'

export const Route = createFileRoute('/_marketing/application-musculation')({
  component: MusculationPage,
})

function MusculationPage() {
  return (
    <ThematicMarketingView
      page={MUSCULATION_PAGE}
      primaryFeatureIds={PAGE_FEATURE_GROUPS.musculation.free}
      premiumFeatureIds={PAGE_FEATURE_GROUPS.musculation.premium}
      primarySectionTitle="Tout pour suivre et progresser en musculation"
      primarySectionDescription="Du planning à la séance active, en passant par les records et la bibliothèque d’exercices."
      premiumSectionTitle="Premium musculation : sans limites"
      premiumSectionDescription="Historique illimité, stats avancées, modèles et programmes sans plafond, suggestions de charge illimitées."
    />
  )
}
