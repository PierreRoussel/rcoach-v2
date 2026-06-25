import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/stats')({
  beforeLoad: ({ location }) => {
    const path = location.pathname.replace(/\/$/, '')
    if (path === '/app/stats') {
      throw redirect({ to: '/app/sessions', search: { tab: 'stats' } })
    }
  },
  component: StatsLayout,
})

function StatsLayout() {
  return <Outlet />
}
