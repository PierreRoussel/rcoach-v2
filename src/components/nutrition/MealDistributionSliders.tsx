import { Slider } from '@/components/ui/slider'
import { mealCaloriesFromPercent } from '@/lib/nutrition/linked-percentages'

export type MealDistributionKey = 'breakfast' | 'lunch' | 'snack' | 'dinner'

const MEAL_LABELS: Record<MealDistributionKey, string> = {
  breakfast: 'Petit dejeuner',
  lunch: 'Repas',
  snack: 'Gouter',
  dinner: 'Diner',
}

const MEAL_ORDER: MealDistributionKey[] = ['breakfast', 'lunch', 'snack', 'dinner']

type MealDistributionSlidersProps = {
  values: Record<MealDistributionKey, number>
  dailyCalories: number
  onChange: (key: MealDistributionKey, value: number) => void
}

export function MealDistributionSliders({
  values,
  dailyCalories,
  onChange,
}: MealDistributionSlidersProps) {
  const total = MEAL_ORDER.reduce((sum, key) => sum + values[key], 0)

  return (
    <div className="space-y-5">
      {MEAL_ORDER.map((key) => (
        <MealPctSlider
          key={key}
          label={MEAL_LABELS[key]}
          value={values[key]}
          calories={mealCaloriesFromPercent(dailyCalories, values[key])}
          onChange={(value) => onChange(key, value)}
        />
      ))}
      <p className="text-sm text-muted-foreground">Total : {total}% · {dailyCalories} kcal</p>
    </div>
  )
}

function MealPctSlider({
  label,
  value,
  calories,
  onChange,
}: {
  label: string
  value: number
  calories: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-right text-muted-foreground">
          <span className="font-semibold text-foreground">{value}%</span>
          <span className="mx-1">·</span>
          <span>{calories} kcal</span>
        </span>
      </div>
      <Slider value={[value]} min={5} max={85} step={1} onValueChange={(next) => onChange(next[0] ?? value)} />
    </div>
  )
}

export const DEFAULT_MEAL_DISTRIBUTION: Record<MealDistributionKey, number> = {
  breakfast: 20,
  lunch: 35,
  snack: 10,
  dinner: 35,
}
