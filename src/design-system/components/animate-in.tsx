import { Children, type CSSProperties, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

const enterAnimationClass =
  'animate-in fade-in slide-in-from-bottom-2 duration-500'

type AnimateInProps = {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section'
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  as: Component = 'div',
}: AnimateInProps) {
  const style: CSSProperties = {
    animationDelay: `${delay}ms`,
    animationFillMode: 'both',
  }

  return (
    <Component className={cn(enterAnimationClass, className)} style={style}>
      {children}
    </Component>
  )
}

type StaggerGroupProps = {
  children: ReactNode
  className?: string
  baseDelay?: number
  staggerMs?: number
}

export function StaggerGroup({
  children,
  className,
  baseDelay = 0,
  staggerMs = 80,
}: StaggerGroupProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, index) => {
        if (child == null) {
          return null
        }

        const style: CSSProperties = {
          animationDelay: `${baseDelay + index * staggerMs}ms`,
          animationFillMode: 'both',
        }

        return (
          <div key={index} className={enterAnimationClass} style={style}>
            {child}
          </div>
        )
      })}
    </div>
  )
}
