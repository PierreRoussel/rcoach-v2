import { cn } from '@/lib/utils'

type LastSetPerformanceHintProps = {
  summary: string | null | undefined
  className?: string
}

export function LastSetPerformanceHint({
  summary,
  className,
}: LastSetPerformanceHintProps) {
  if (!summary) {
    return (
      <span
        className={cn(
          'block truncate text-center text-[10px] leading-tight text-muted-foreground/60',
          className,
        )}
      >
        —
      </span>
    )
  }

  return (
    <span
      className={cn(
        'block truncate text-center text-[10px] font-data leading-tight text-muted-foreground',
        className,
      )}
      title={summary}
    >
      {summary}
    </span>
  )
}
