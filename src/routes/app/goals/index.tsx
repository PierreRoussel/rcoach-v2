import { createFileRoute } from '@tanstack/react-router'

import { GoalsPage } from '@/components/goals/GoalsPage'

export const Route = createFileRoute('/app/goals/')({
  validateSearch: (search: Record<string, unknown>) => ({
    previewWeightGoalReached:
      search.previewWeightGoalReached === '1' ||
      search.previewWeightGoalReached === 1 ||
      search.previewWeightGoalReached === true,
  }),
  component: AppGoalsPage,
})

function AppGoalsPage() {
  const { previewWeightGoalReached } = Route.useSearch()

  return (
    <div className="space-y-4">
      <GoalsPage previewWeightGoalReached={previewWeightGoalReached} />
    </div>
  )
}
