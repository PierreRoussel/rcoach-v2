import { Link } from '@tanstack/react-router'
import { Activity, BarChart2, UserRound } from 'lucide-react'

import { cn } from '@/lib/utils'

const items = [
  { to: '/app', label: 'Home', icon: Activity, exact: true },
  { to: '/app/stats', label: 'Stats', icon: BarChart2, exact: false },
  { to: '/app/profile', label: 'Profil', icon: UserRound, exact: false },
] as const

export function AppBottomNav() {
  return (
    <nav className="sticky bottom-0 grid grid-cols-3 border-t border-border bg-card/95 px-2 py-2 text-xs backdrop-blur">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          className="rounded-xl px-2 py-2 text-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          activeProps={{
            className: cn(
              'rounded-xl bg-soft-primary px-2 py-2 text-center font-bold text-primary',
            ),
          }}
        >
          <span className="mx-auto mb-1 flex justify-center">
            <item.icon className="size-4" />
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
