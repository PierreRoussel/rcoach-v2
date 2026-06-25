import { Slider } from '@/components/ui/slider'

export type MacroDistributionKey = 'carbs' | 'protein' | 'fat'

const MACRO_LABELS: Record<MacroDistributionKey, string> = {
  carbs: 'Glucides',
  protein: 'Protéines',
  fat: 'Lipides',
}

const MACRO_ORDER: MacroDistributionKey[] = ['carbs', 'protein', 'fat']

const KCAL_PER_GRAM: Record<MacroDistributionKey, number> = {
  carbs: 4,
  protein: 4,
  fat: 9,
}

type MacroDistributionSlidersProps = {
  values: Record<MacroDistributionKey, number>
  dailyCalories: number
  onChange: (key: MacroDistributionKey, value: number) => void
}

export function MacroDistributionSliders({
  values,
  dailyCalories,
  onChange,
}: MacroDistributionSlidersProps) {
  const total = MACRO_ORDER.reduce((sum, key) => sum + values[key], 0)

  return (
    <div className="space-y-5">
      {MACRO_ORDER.map((key) => (
        <MacroPctSlider
          key={key}
          label={MACRO_LABELS[key]}
          value={values[key]}
          grams={macroGramsFromPercent(dailyCalories, values[key], key)}
          onChange={(value) => onChange(key, value)}
        />
      ))}
      <p className="text-sm text-muted-foreground">Total : {total}%</p>
    </div>
  )
}

function macroGramsFromPercent(dailyCalories: number, percent: number, key: MacroDistributionKey) {
  return Math.round((dailyCalories * (percent / 100)) / KCAL_PER_GRAM[key])
}

function MacroPctSlider({
  label,
  value,
  grams,
  onChange,
}: {
  label: string
  value: number
  grams: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-right text-muted-foreground">
          <span className="font-semibold text-foreground">{value}%</span>
          <span className="mx-1">·</span>
          <span>{grams} g</span>
        </span>
      </div>
      <Slider value={[value]} min={5} max={90} step={1} onValueChange={(next) => onChange(next[0] ?? value)} />
    </div>
  )
}

export const DEFAULT_MACRO_DISTRIBUTION: Record<MacroDistributionKey, number> = {
  carbs: 40,
  protein: 30,
  fat: 30,
}
