import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/diet')({
  component: DietLayout,
})

function DietLayout() {
  return <Outlet />
}
