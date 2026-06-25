import { createFileRoute } from '@tanstack/react-router'

import { GoalsPage } from '@/components/goals/GoalsPage'

export const Route = createFileRoute('/app/goals/')({
  component: AppGoalsPage,
})

function AppGoalsPage() {
  return (
    <div className="space-y-4">
      <GoalsPage />
    </div>
  )
}
