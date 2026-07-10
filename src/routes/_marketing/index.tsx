import { createFileRoute } from '@tanstack/react-router'

import { HomeMarketingView } from '@/components/marketing/HomeMarketingView'

export const Route = createFileRoute('/_marketing/')({
  component: HomePage,
})

function HomePage() {
  return <HomeMarketingView />
}
