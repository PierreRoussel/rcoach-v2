import { cn } from '@/lib/utils'

type FeedbackMessageProps = React.ComponentProps<'p'> & {
  variant?: 'success' | 'error' | 'info'
}

function FeedbackMessage({
  variant = 'error',
  className,
  children,
  ...props
}: FeedbackMessageProps) {
  if (!children) {
    return null
  }

  return (
    <p
      data-slot="feedback-message"
      data-variant={variant}
      className={cn(
        'text-sm',
        variant === 'success' && 'text-success',
        variant === 'error' && 'text-destructive',
        variant === 'info' && 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { FeedbackMessage }
