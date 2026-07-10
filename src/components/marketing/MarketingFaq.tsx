import type { MarketingFaqItem } from '@/content/marketing/pages'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type MarketingFaqProps = {
  items: MarketingFaqItem[]
  title?: string
  id?: string
}

export function MarketingFaq({ items, title = 'Questions fréquentes', id }: MarketingFaqProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section id={id} className="mx-auto max-w-3xl scroll-mt-24 px-4 py-12">
      <h2 className="text-center font-display text-3xl font-black">{title}</h2>
      <Accordion type="single" collapsible className="mt-6">
        {items.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger className="text-left font-semibold">{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
