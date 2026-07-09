import { Link } from '@tanstack/react-router'
import { Activity, BarChart2, CalendarDays, Tag, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

const baseItems = [
  { to: '/coach', label: 'Dashboard', icon: Activity, exact: true },
  { to: '/coach/clients', label: 'Clients', icon: Users, exact: false },
  { to: '/coach/programs', label: 'Programmes', icon: CalendarDays, exact: false },
  { to: '/coach/analytics', label: 'Analytics', icon: BarChart2, exact: false },
] as const

const adminItems = [
  { to: '/coach/validate-product-renames', label: 'Renommages', icon: Tag, exact: false },
] as const

type CoachBottomNavProps = {
  showAdminNav?: boolean
}

export function CoachBottomNav({ showAdminNav = false }: CoachBottomNavProps) {
  const items = showAdminNav ? [...baseItems, ...adminItems] : [...baseItems]

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-card/95 px-1 py-2 text-[10px] backdrop-blur md:hidden',
        showAdminNav ? 'grid-cols-5' : 'grid-cols-4',
      )}
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          className="rounded-xl px-1 py-2 text-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          activeProps={{
            className: cn(
              'rounded-xl bg-soft-primary px-1 py-2 text-center font-bold text-primary',
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
