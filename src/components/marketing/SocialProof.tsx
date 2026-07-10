import { Pill } from '@/design-system'

const STATS = [
  { value: '3-en-1', label: 'Séances, nutrition, objectifs' },
  { value: 'PWA', label: 'Web + Android installable' },
  { value: 'FR', label: 'Interface en français' },
  { value: '7j', label: "Essai Premium possible" },
] as const

export function SocialProof() {
  return (
    <section className="border-y border-border/70 bg-muted/25">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.value} className="text-center">
            <p className="font-display text-2xl font-black text-primary md:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-4 pb-8">
        <Pill tone="secondary">Suivi musculation</Pill>
        <Pill tone="secondary">Journal nutrition</Pill>
        <Pill tone="secondary">Macros & calories</Pill>
        <Pill tone="secondary">Objectif poids</Pill>
        <Pill tone="secondary">Badges & streaks</Pill>
      </div>
    </section>
  )
}
