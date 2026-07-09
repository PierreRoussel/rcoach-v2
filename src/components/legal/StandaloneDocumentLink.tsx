import { Link } from '@tanstack/react-router'
import type { ComponentProps, ReactNode } from 'react'

import { useInAppShell } from '@/hooks/useInAppShell'
import { standaloneDocumentHref } from '@/lib/legal/standalone-documents'
import { cn } from '@/lib/utils'

type StandaloneDocumentLinkProps = Omit<ComponentProps<'a'>, 'href'> & {
  path: string
  children: ReactNode
  className?: string
  forceExternal?: boolean
  forceInternal?: boolean
}

export function StandaloneDocumentLink({
  path,
  children,
  className,
  forceExternal,
  forceInternal,
  onClick,
  ...rest
}: StandaloneDocumentLinkProps) {
  const inAppShell = useInAppShell()
  const openExternal = forceExternal ?? (!forceInternal && inAppShell)

  if (openExternal) {
    return (
      <a
        href={standaloneDocumentHref(path, { fromApp: true })}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(className)}
        onClick={onClick}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={path} className={cn(className)} onClick={onClick}>
      {children}
    </Link>
  )
}
