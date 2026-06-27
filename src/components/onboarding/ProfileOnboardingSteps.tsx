import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createEmptyProfileOnboardingForm,
  type ProfileOnboardingFormData,
} from '@/lib/onboarding/profile-form'
import type { NutritionSex } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

const STEPS = ['sex', 'age', 'height', 'weight'] as const

type ProfileOnboardingStepsProps = {
  onComplete: (data: ProfileOnboardingFormData) => Promise<void>
  onSkipAll: () => Promise<void>
}

export function ProfileOnboardingSteps({ onComplete, onSkipAll }: ProfileOnboardingStepsProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState(createEmptyProfileOnboardingForm)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  function patchForm(patch: Partial<ProfileOnboardingFormData>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  async function finish(data: ProfileOnboardingFormData) {
    setError(null)
    setIsSubmitting(true)

    try {
      await onComplete(data)
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : 'Impossible de sauvegarder vos informations.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkipStep() {
    if (isLastStep) {
      await finish(form)
      return
    }

    setStepIndex((current) => current + 1)
  }

  async function handleContinue() {
    if (isLastStep) {
      await finish(form)
      return
    }

    setStepIndex((current) => current + 1)
  }

  async function handleSkipAll() {
    setError(null)
    setIsSubmitting(true)

    try {
      await onSkipAll()
    } catch (skipError) {
      setError(
        skipError instanceof Error
          ? skipError.message
          : 'Impossible de terminer l\'onboarding.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-gradient-hero">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-xs font-medium text-muted-foreground">
          Profil · {stepIndex + 1}/{STEPS.length}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
          disabled={isSubmitting}
          onClick={() => void handleSkipAll()}
        >
          Tout passer
        </Button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-6">
        {step === 'sex' ? (
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="font-display text-2xl font-black text-foreground">Sexe</h2>
              <p className="text-sm text-muted-foreground">
                Utilisé pour personnaliser vos estimations nutritionnelles.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['male', 'Homme'],
                ['female', 'Femme'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    'h-24 rounded-2xl border text-base font-semibold transition-colors',
                    form.sex === value
                      ? 'border-primary bg-soft-primary text-primary'
                      : 'border-border bg-card text-foreground',
                  )}
                  onClick={() => patchForm({ sex: value satisfies NutritionSex })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 'age' ? (
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="font-display text-2xl font-black text-foreground">Âge</h2>
              <p className="text-sm text-muted-foreground">En années.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-age" className="sr-only">
                Âge
              </Label>
              <Input
                id="onboarding-age"
                value={form.age}
                onChange={(event) => patchForm({ age: event.target.value })}
                inputMode="numeric"
                placeholder="30"
                className="h-14 text-center text-2xl font-semibold"
              />
            </div>
          </div>
        ) : null}

        {step === 'height' ? (
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="font-display text-2xl font-black text-foreground">Taille</h2>
              <p className="text-sm text-muted-foreground">En centimètres.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-height" className="sr-only">
                Taille
              </Label>
              <Input
                id="onboarding-height"
                value={form.heightCm}
                onChange={(event) => patchForm({ heightCm: event.target.value })}
                inputMode="decimal"
                placeholder="175"
                className="h-14 text-center text-2xl font-semibold"
              />
            </div>
          </div>
        ) : null}

        {step === 'weight' ? (
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="font-display text-2xl font-black text-foreground">Poids</h2>
              <p className="text-sm text-muted-foreground">En kilogrammes.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-weight" className="sr-only">
                Poids
              </Label>
              <Input
                id="onboarding-weight"
                value={form.weightKg}
                onChange={(event) => patchForm({ weightKg: event.target.value })}
                inputMode="decimal"
                placeholder="75"
                className="h-14 text-center text-2xl font-semibold"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
        <Button
          type="button"
          variant="pill"
          className="h-12 w-full rounded-full"
          disabled={isSubmitting}
          onClick={() => void handleContinue()}
        >
          {isSubmitting ? 'Enregistrement...' : isLastStep ? 'Terminer' : 'Continuer'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full rounded-full"
          disabled={isSubmitting}
          onClick={() => void handleSkipStep()}
        >
          Passer cette étape
        </Button>
      </div>
    </div>
  )
}
