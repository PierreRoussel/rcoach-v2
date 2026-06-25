import { createFileRoute, Link } from '@tanstack/react-router'

import { NutritionSettingsForm } from '@/components/nutrition/NutritionSettingsForm'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/design-system'

export const Route = createFileRoute('/app/diet/settings')({
  component: NutritionSettingsPage,
})

function NutritionSettingsPage() {
  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Nutrition"
          description="Ajustez vos objectifs caloriques, macros et répartition des repas."
        />
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <Link to="/app/diet">Retour</Link>
        </Button>
      </div>

      <NutritionSettingsForm />
    </div>
  )
}
