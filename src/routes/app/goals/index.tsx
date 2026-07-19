import { createFileRoute } from '@tanstack/react-router'

import { GoalsPage } from '@/components/goals/GoalsPage'

export const Route = createFileRoute('/app/goals/')({
  validateSearch: (search: Record<string, unknown>) => {
    const previewWeightGoalSetupRaw = search.previewWeightGoalSetup
    const previewWeightGoalSetup =
      previewWeightGoalSetupRaw === 'lose' || previewWeightGoalSetupRaw === 'gain'
        ? previewWeightGoalSetupRaw
        : null

    const previewWeightMilestoneRaw = search.previewWeightMilestone
    const previewWeightMilestoneParsed =
      typeof previewWeightMilestoneRaw === 'number'
        ? previewWeightMilestoneRaw
        : typeof previewWeightMilestoneRaw === 'string'
          ? Number.parseInt(previewWeightMilestoneRaw, 10)
          : null
    const previewWeightMilestone =
      previewWeightMilestoneParsed != null &&
      Number.isFinite(previewWeightMilestoneParsed) &&
      previewWeightMilestoneParsed >= 1
        ? previewWeightMilestoneParsed
        : null

    return {
      previewWeightGoalReached:
        search.previewWeightGoalReached === '1' ||
        search.previewWeightGoalReached === 1 ||
        search.previewWeightGoalReached === true,
      previewWeightGoalSetup,
      previewWeightMilestone,
    }
  },
  component: AppGoalsPage,
})

function AppGoalsPage() {
  const {
    previewWeightGoalReached,
    previewWeightGoalSetup,
    previewWeightMilestone,
  } = Route.useSearch()

  return (
    <div className="space-y-4">
      <GoalsPage
        previewWeightGoalReached={previewWeightGoalReached}
        previewWeightGoalSetup={previewWeightGoalSetup}
        previewWeightMilestone={previewWeightMilestone}
      />
    </div>
  )
}
