import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/diet')({
  component: DietLayout,
})

function DietLayout() {
  return (
    <div className="diet-page relative min-h-full">
      <Outlet />
    </div>
  )
}
