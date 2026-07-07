import { createFileRoute } from '@tanstack/react-router'

import { GoalsPage } from '@/components/goals/GoalsPage'

export const Route = createFileRoute('/app/goals/')({
  validateSearch: (search: Record<string, unknown>) => {
    const previewWeightGoalSetupRaw = search.previewWeightGoalSetup
    const previewWeightGoalSetup =
      previewWeightGoalSetupRaw === 'lose' || previewWeightGoalSetupRaw === 'gain'
        ? previewWeightGoalSetupRaw
        : null

    return {
      previewWeightGoalReached:
        search.previewWeightGoalReached === '1' ||
        search.previewWeightGoalReached === 1 ||
        search.previewWeightGoalReached === true,
      previewWeightGoalSetup,
    }
  },
  component: AppGoalsPage,
})

function AppGoalsPage() {
  const { previewWeightGoalReached, previewWeightGoalSetup } = Route.useSearch()

  return (
    <div className="space-y-4">
      <GoalsPage
        previewWeightGoalReached={previewWeightGoalReached}
        previewWeightGoalSetup={previewWeightGoalSetup}
      />
    </div>
  )
}
