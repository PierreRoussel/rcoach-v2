import { createFileRoute, Outlet } from '@tanstack/react-router'

import { MarketingShell } from '@/components/marketing/MarketingShell'

export const Route = createFileRoute('/_marketing')({
  component: MarketingLayout,
})

function MarketingLayout() {
  return (
    <MarketingShell>
      <Outlet />
    </MarketingShell>
  )
}
