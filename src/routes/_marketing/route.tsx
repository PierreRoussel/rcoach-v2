import { Capacitor } from '@capacitor/core'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { MarketingShell } from '@/components/marketing/MarketingShell'
import { createSectionNotFoundRedirect } from '@/lib/router/section-not-found-redirect'

export const Route = createFileRoute('/_marketing')({
  beforeLoad: () => {
    if (Capacitor.isNativePlatform()) {
      throw redirect({ to: '/app', replace: true })
    }
  },
  component: MarketingLayout,
  notFoundComponent: createSectionNotFoundRedirect('/'),
})

function MarketingLayout() {
  return (
    <MarketingShell>
      <Outlet />
    </MarketingShell>
  )
}
