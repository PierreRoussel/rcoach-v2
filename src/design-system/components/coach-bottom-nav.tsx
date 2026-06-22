import { Link } from '@tanstack/react-router'
import { Activity, BarChart2, CalendarDays, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

const items = [
  { to: '/coach', label: 'Dashboard', icon: Activity, exact: true },
  { to: '/coach/clients', label: 'Clients', icon: Users, exact: false },
  { to: '/coach/programs', label: 'Programmes', icon: CalendarDays, exact: false },
  { to: '/coach/analytics', label: 'Analytics', icon: BarChart2, exact: false },
] as const

export function CoachBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 px-2 py-2 text-xs backdrop-blur md:hidden">
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
