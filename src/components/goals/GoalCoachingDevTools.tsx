import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useGoalCoachingDevTools } from '@/components/goals/GoalCoachingProvider'

export function GoalCoachingDevTools() {
  const devTools = useGoalCoachingDevTools()

  if (!import.meta.env.DEV || !devTools) {
    return null
  }

  return (
    <Card className="rounded-2xl border-dashed border-violet-300/60 bg-violet-50/40">
      <CardHeader>
        <CardTitle className="font-display text-base font-black">
          Dev · Coaching stagnation
        </CardTitle>
        <CardDescription>
          Simuler le parcours coaching objectif poids (environnement local).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={devTools.forcePrompt}
        >
          Forcer le prompt
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={devTools.resetDevState}
        >
          Reset snooze / session
        </Button>
      </CardContent>
    </Card>
  )
}
