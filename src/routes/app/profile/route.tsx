import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/profile')({
  component: ProfileLayout,
})

function ProfileLayout() {
  return <Outlet />
}
