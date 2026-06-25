import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_MEAL_DISTRIBUTION,
  MealDistributionSliders,
  type MealDistributionKey,
} from '@/components/nutrition/MealDistributionSliders'
import {
  DEFAULT_MACRO_DISTRIBUTION,
  MacroDistributionSliders,
  type MacroDistributionKey,
} from '@/components/nutrition/MacroDistributionSliders'
import { adjustLinkedPercentages } from '@/lib/nutrition/linked-percentages'
import type { ActivityLevel, NutritionGoal, NutritionSex } from '@/lib/nutrition/types'

export const NUTRITION_ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sédentaire',
  light: 'Léger',
  moderate: 'Modéré',
  active: 'Actif',
  very_active: 'Très actif',
}

export const NUTRITION_GOAL_LABELS: Record<NutritionGoal, string> = {
  lose: 'Perte de poids',
  maintain: 'Maintien',
  gain: 'Prise de masse',
}

export type NutritionWizardFormState = {
  sex: NutritionSex
  age: string
  heightCm: string
  weightKg: string
  activityLevel: ActivityLevel
  goal: NutritionGoal
  dailyCalories: string
  macroDistribution: typeof DEFAULT_MACRO_DISTRIBUTION
  mealDistribution: typeof DEFAULT_MEAL_DISTRIBUTION
}

export function createDefaultNutritionWizardState(): NutritionWizardFormState {
  return {
    sex: 'male',
    age: '30',
    heightCm: '175',
    weightKg: '75',
    activityLevel: 'moderate',
    goal: 'maintain',
    dailyCalories: '2200',
    macroDistribution: { ...DEFAULT_MACRO_DISTRIBUTION },
    mealDistribution: { ...DEFAULT_MEAL_DISTRIBUTION },
  }
}

type NutritionBodyStepProps = {
  state: NutritionWizardFormState
  onChange: (patch: Partial<NutritionWizardFormState>) => void
}

export function NutritionBodyStep({ state, onChange }: NutritionBodyStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Sexe</Label>
        <Select
          value={state.sex}
          onValueChange={(value) => onChange({ sex: value as NutritionSex })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Homme</SelectItem>
            <SelectItem value="female">Femme</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Âge</Label>
          <Input
            value={state.age}
            onChange={(event) => onChange({ age: event.target.value })}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label>Taille (cm)</Label>
          <Input
            value={state.heightCm}
            onChange={(event) => onChange({ heightCm: event.target.value })}
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label>Poids (kg)</Label>
          <Input
            value={state.weightKg}
            onChange={(event) => onChange({ weightKg: event.target.value })}
            inputMode="decimal"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Activité</Label>
        <Select
          value={state.activityLevel}
          onValueChange={(value) =>
            onChange({ activityLevel: value as ActivityLevel })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(NUTRITION_ACTIVITY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Objectif nutrition</Label>
        <Select
          value={state.goal}
          onValueChange={(value) => onChange({ goal: value as NutritionGoal })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(NUTRITION_GOAL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Objectif calorique journalier</Label>
        <Input
          value={state.dailyCalories}
          onChange={(event) => onChange({ dailyCalories: event.target.value })}
          inputMode="numeric"
        />
      </div>
    </div>
  )
}

type NutritionMacroStepProps = {
  state: NutritionWizardFormState
  onMacroChange: (key: MacroDistributionKey, value: number) => void
}

export function NutritionMacroStep({ state, onMacroChange }: NutritionMacroStepProps) {
  return (
    <MacroDistributionSliders
      values={state.macroDistribution}
      dailyCalories={Number(state.dailyCalories) || 0}
      onChange={onMacroChange}
    />
  )
}

type NutritionMealStepProps = {
  state: NutritionWizardFormState
  onMealChange: (key: MealDistributionKey, value: number) => void
}

export function NutritionMealStep({ state, onMealChange }: NutritionMealStepProps) {
  return (
    <MealDistributionSliders
      values={state.mealDistribution}
      dailyCalories={Number(state.dailyCalories) || 0}
      onChange={onMealChange}
    />
  )
}

export function patchMacroDistribution(
  current: NutritionWizardFormState['macroDistribution'],
  key: MacroDistributionKey,
  value: number,
) {
  return adjustLinkedPercentages(current, key, value)
}

export function patchMealDistribution(
  current: NutritionWizardFormState['mealDistribution'],
  key: MealDistributionKey,
  value: number,
) {
  return adjustLinkedPercentages(current, key, value)
}
