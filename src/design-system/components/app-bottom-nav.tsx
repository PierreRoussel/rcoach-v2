import { Link, useRouterState } from '@tanstack/react-router'
import { Activity, List, UtensilsCrossed, UserRound } from 'lucide-react'

import { useProfileNavBadgeCount } from '@/hooks/useFriends'
import { DIET_NAV_ACTIVE } from '@/lib/nutrition/diet-theme'
import { cn } from '@/lib/utils'

const items = [
  { to: '/app', label: 'Home', icon: Activity, exact: true },
  { to: '/app/sessions', label: 'Séances', icon: List },
  { to: '/app/diet', label: 'Diète', icon: UtensilsCrossed },
  { to: '/app/profile', label: 'Profil', icon: UserRound, badge: true },
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
  const badgeCount = useProfileNavBadgeCount()

  return (
    <nav className="sticky bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-xs shadow-[0_-1px_0_0_var(--border)]">
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item)
        const showBadge = 'badge' in item && item.badge && badgeCount > 0

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-xl px-2 py-2 text-center transition-colors hover:bg-muted hover:text-foreground',
              isActive && item.to === '/app/diet'
                ? DIET_NAV_ACTIVE
                : isActive
                  ? 'bg-soft-primary font-bold text-soft-primary-fg'
                  : 'text-muted-foreground',
            )}
          >
            <span className="relative mx-auto mb-1 flex w-fit justify-center">
              <item.icon className="size-4" />
              {showBadge ? (
                <span className="absolute -right-2 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              ) : null}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
