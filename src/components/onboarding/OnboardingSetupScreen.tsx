import { Check, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SETUP_STEPS = [
  'Analyse de vos préférences',
  'Configuration de vos objectifs',
  'Préparation de l’espace entraînement',
  'Calibration nutrition',
  'Finalisation de votre profil',
] as const

const MIN_SETUP_MS = 3800
const STEP_INTERVAL_MS = 720

type OnboardingSetupScreenProps = {
  displayName: string
  onPersist: () => Promise<void>
  onContinue: () => void
}

type SetupPhase = 'setup' | 'welcome'

export function OnboardingSetupScreen({
  displayName,
  onPersist,
  onContinue,
}: OnboardingSetupScreenProps) {
  const [phase, setPhase] = useState<SetupPhase>('setup')
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [isPersisting, setIsPersisting] = useState(true)
  const readyRef = useRef(false)
  const persistDoneRef = useRef(false)
  const onPersistRef = useRef(onPersist)

  onPersistRef.current = onPersist

  useEffect(() => {
    let cancelled = false
    const startedAt = Date.now()

    async function runPersist() {
      try {
        await onPersistRef.current()
        if (!cancelled) {
          persistDoneRef.current = true
          setIsPersisting(false)
          setPersistError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setPersistError(
            error instanceof Error
              ? error.message
              : 'Impossible de finaliser la configuration.',
          )
          setIsPersisting(false)
        }
      }
    }

    void runPersist()

    const stepTimer = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % SETUP_STEPS.length)
    }, STEP_INTERVAL_MS)

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const target = persistDoneRef.current
        ? Math.min(100, 88 + (elapsed - MIN_SETUP_MS) / 40)
        : Math.min(88, (elapsed / MIN_SETUP_MS) * 88)

      setProgress((current) => Math.max(current, target))
    }, 40)

    const finishTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      if (elapsed >= MIN_SETUP_MS && persistDoneRef.current && !readyRef.current) {
        readyRef.current = true
        setProgress(100)
        window.setTimeout(() => setPhase('welcome'), 420)
      }
    }, 80)

    return () => {
      cancelled = true
      window.clearInterval(stepTimer)
      window.clearInterval(progressTimer)
      window.clearInterval(finishTimer)
    }
  }, [])

  async function retryPersist() {
    setIsPersisting(true)
    setPersistError(null)

    try {
      await onPersistRef.current()
      persistDoneRef.current = true
      setIsPersisting(false)
      setProgress(100)
      window.setTimeout(() => setPhase('welcome'), 420)
    } catch (error) {
      setPersistError(
        error instanceof Error
          ? error.message
          : 'Impossible de finaliser la configuration.',
      )
      setIsPersisting(false)
    }
  }

  return (
    <div className="relative h-svh max-h-svh overflow-hidden">
      <div
        className={cn(
          'onboarding-setup-bg pointer-events-none absolute inset-0',
          phase === 'welcome' && 'onboarding-setup-bg-welcome',
        )}
        aria-hidden
      />
      <div className="onboarding-setup-orb onboarding-setup-orb-a pointer-events-none" aria-hidden />
      <div className="onboarding-setup-orb onboarding-setup-orb-b pointer-events-none" aria-hidden />
      <div className="onboarding-setup-orb onboarding-setup-orb-c pointer-events-none" aria-hidden />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {phase === 'setup' ? (
          <div className="onboarding-setup-panel flex w-full max-w-sm flex-col items-center text-center">
            <div className="relative mb-8 size-28">
              <svg className="size-28 -rotate-90" viewBox="0 0 120 120" aria-hidden>
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="color-mix(in srgb, var(--background) 55%, transparent)"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="var(--primary-foreground)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 327} 327`}
                  className="transition-[stroke-dasharray] duration-300 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="onboarding-setup-spark size-9 text-primary-foreground" />
              </div>
            </div>

            <p className="font-display text-lg font-bold text-primary-foreground/90">
              Configuration en cours
            </p>
            <h1 className="onboarding-setup-title mt-2 font-display text-2xl font-black leading-tight text-primary-foreground">
              Préparation du profil pour{' '}
              <span className="onboarding-setup-name">{displayName}</span>
            </h1>

            <p
              key={stepIndex}
              className="onboarding-setup-step mt-6 min-h-[1.25rem] text-sm font-medium text-primary-foreground/75"
            >
              {SETUP_STEPS[stepIndex]}
            </p>

            {persistError ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-primary-foreground">{persistError}</p>
                <Button
                  type="button"
                  variant="pill"
                  size="sm"
                  className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  disabled={isPersisting}
                  onClick={() => void retryPersist()}
                >
                  Réessayer
                </Button>
              </div>
            ) : null}

            <div className="mt-8 flex w-full gap-2">
              {SETUP_STEPS.map((_, index) => (
                <span
                  key={SETUP_STEPS[index]}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-500',
                    index <= stepIndex
                      ? 'bg-primary-foreground/90'
                      : 'bg-primary-foreground/25',
                  )}
                />
              ))}
            </div>

            {isPersisting ? (
              <p className="mt-4 text-xs text-primary-foreground/55">Quelques instants…</p>
            ) : null}
          </div>
        ) : (
          <div className="onboarding-welcome-panel flex w-full max-w-sm flex-col items-center text-center">
            <div className="onboarding-welcome-badge mb-6 flex size-16 items-center justify-center rounded-full bg-primary-foreground/15 ring-2 ring-primary-foreground/30">
              <Check className="size-8 text-primary-foreground" strokeWidth={2.5} />
            </div>

            <p className="onboarding-welcome-kicker text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              Tout est prêt
            </p>
            <h1 className="onboarding-welcome-title mt-3 font-display text-4xl font-black leading-none text-primary-foreground">
              Bienvenue
            </h1>
            <p className="onboarding-welcome-name mt-2 font-display text-3xl font-black text-primary-foreground">
              {displayName}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/75">
              Votre espace est configuré. Il ne reste plus qu’à commencer.
            </p>

            <Button
              type="button"
              variant="pill"
              size="lg"
              className="onboarding-welcome-cta mt-10 h-12 w-full rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover:text-primary"
              onClick={onContinue}
            >
              C&apos;est parti
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
