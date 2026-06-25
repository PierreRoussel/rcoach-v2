import { Link, useRouterState } from '@tanstack/react-router'
import { Activity, List, UtensilsCrossed, UserRound } from 'lucide-react'

import { cn } from '@/lib/utils'

const items = [
  { to: '/app', label: 'Home', icon: Activity, exact: true },
  { to: '/app/sessions', label: 'Séances', icon: List },
  { to: '/app/diet', label: 'Diète', icon: UtensilsCrossed },
  { to: '/app/profile', label: 'Profil', icon: UserRound },
] as const

function isNavItemActive(pathname: string, item: (typeof items)[number]) {
  if ('exact' in item && item.exact) {
    return pathname === '/app' || pathname === '/app/'
  }

  if (item.to === '/app/sessions') {
    return pathname.startsWith('/app/sessions') || pathname.startsWith('/app/stats')
  }

  if (item.to === '/app/diet') {
    return pathname.startsWith('/app/diet')
  }

  return pathname.startsWith(item.to)
}

export function AppBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav className="sticky bottom-0 grid grid-cols-4 border-t border-border bg-card/95 px-2 py-2 text-xs backdrop-blur">
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item)

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-xl px-2 py-2 text-center transition-colors hover:bg-muted hover:text-foreground',
              isActive
                ? 'bg-soft-primary font-bold text-primary'
                : 'text-muted-foreground',
            )}
          >
            <span className="mx-auto mb-1 flex justify-center">
              <item.icon className="size-4" />
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
