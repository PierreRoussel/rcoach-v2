const VALUE_PROPS = [
  {
    value: 'Gratuit',
    label: 'Séances et nutrition de base',
  },
  {
    value: '3-en-1',
    label: 'Entraînement, diète, objectifs',
  },
  {
    value: 'PWA',
    label: 'Web et Android installable',
  },
  {
    value: 'Premium',
    label: 'Stats, historique et conseils nutrition',
  },
] as const

export function HomeValueProps() {
  return (
    <section className="border-y border-border/60 bg-background">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4 md:gap-6 md:py-12">
        {VALUE_PROPS.map((item) => (
          <div key={item.value} className="text-center">
            <p className="font-display text-2xl font-black tracking-tight text-foreground md:text-[1.75rem]">
              {item.value}
            </p>
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground md:text-sm">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
