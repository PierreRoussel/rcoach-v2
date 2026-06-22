import { createRootRoute, Outlet } from '@tanstack/react-router'

import { AndroidBackNavigation } from '@/components/app/AndroidBackNavigation'

function RootLayout() {
  return (
    <div className="min-h-svh bg-background font-body text-foreground">
      <AndroidBackNavigation />
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
