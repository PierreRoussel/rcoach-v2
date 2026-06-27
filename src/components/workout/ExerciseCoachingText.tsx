import type { ReactNode } from 'react'

import type { ExerciseCoachingCues } from '@/lib/workout/exercise-coaching'

type ExerciseCoachingTextProps = {
  coaching: ExerciseCoachingCues
}

function CoachingSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  )
}

export function ExerciseCoachingText({ coaching }: ExerciseCoachingTextProps) {
  const hasBullets = Boolean(coaching.cues?.length || coaching.mistakes?.length)

  if (
    !coaching.summary &&
    !coaching.setup &&
    !coaching.execution &&
    !hasBullets
  ) {
    return null
  }

  return (
    <div className="space-y-4 rounded-2xl bg-[color-mix(in_srgb,var(--soft-primary)_42%,transparent)] p-4 ring-1 ring-border/60">
      {coaching.summary ? (
        <CoachingSection title="En bref">{coaching.summary}</CoachingSection>
      ) : null}

      {coaching.setup ? (
        <CoachingSection title="Mise en place">{coaching.setup}</CoachingSection>
      ) : null}

      {coaching.execution ? (
        <CoachingSection title="Exécution">{coaching.execution}</CoachingSection>
      ) : null}

      {coaching.cues?.length ? (
        <CoachingSection title="Repères">
          <ul className="list-disc space-y-1 pl-4">
            {coaching.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </CoachingSection>
      ) : null}

      {coaching.mistakes?.length ? (
        <CoachingSection title="À éviter">
          <ul className="list-disc space-y-1 pl-4">
            {coaching.mistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </CoachingSection>
      ) : null}
    </div>
  )
}
