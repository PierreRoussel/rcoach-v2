import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { BrandLogo, CoachBottomNav, ThemeToggle } from '@/design-system'
import { requireAuthenticatedUser } from '@/lib/auth/guards'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { isAdminProfile, isCoachProfile } from '@/lib/profile/roles'
import { useMyProfile } from '@/hooks/useProfile'
import { createSectionNotFoundRedirect } from '@/lib/router/section-not-found-redirect'

export const Route = createFileRoute('/coach')({
  beforeLoad: requireAuthenticatedUser,
  component: CoachLayout,
  notFoundComponent: createSectionNotFoundRedirect('/coach'),
})

function CoachLayout() {
  const { nhost } = useAuth()
  const navigate = useNavigate()
  const { data: profile } = useMyProfile()

  async function handleSignOut() {
    const session = nhost.getUserSession()
    if (session?.refreshTokenId) {
      await nhost.auth.signOut({ refreshToken: session.refreshTokenId })
    }
    await navigate({ to: '/auth/login' })
  }

  const isCoach = isCoachProfile(profile)
  const showAdminNav = isAdminProfile(profile)

  return (
    <div className="min-h-svh bg-background md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-5 md:block">
        <BrandLogo />
        <p className="mt-6 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Coach ERP
        </p>
        <nav className="space-y-1 text-sm">
          <Link
            to="/coach"
            className="block rounded-xl px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
            activeOptions={{ exact: true }}
            activeProps={{
              className:
                'block rounded-xl bg-sidebar-accent px-3 py-2 font-semibold text-sidebar-primary',
            }}
          >
            Dashboard
          </Link>
          <Link
            to="/coach/clients"
            className="block rounded-xl px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
            activeProps={{
              className:
                'block rounded-xl bg-sidebar-accent px-3 py-2 font-semibold text-sidebar-primary',
            }}
          >
            Clients
          </Link>
          <Link
            to="/coach/programs"
            className="block rounded-xl px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
            activeProps={{
              className:
                'block rounded-xl bg-sidebar-accent px-3 py-2 font-semibold text-sidebar-primary',
            }}
          >
            Programmes
          </Link>
          <Link
            to="/coach/analytics"
            className="block rounded-xl px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
            activeProps={{
              className:
                'block rounded-xl bg-sidebar-accent px-3 py-2 font-semibold text-sidebar-primary',
            }}
          >
            Analytics
          </Link>
          {showAdminNav ? (
            <Link
              to="/coach/admin"
              className="block rounded-xl px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
              activeProps={{
                className:
                  'block rounded-xl bg-sidebar-accent px-3 py-2 font-semibold text-sidebar-primary',
              }}
            >
              Dashboard admin
            </Link>
          ) : null}
          {showAdminNav ? (
            <Link
              to="/coach/validate-product-renames"
              className="block rounded-xl px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
              activeProps={{
                className:
                  'block rounded-xl bg-sidebar-accent px-3 py-2 font-semibold text-sidebar-primary',
              }}
            >
              Renommages produit
            </Link>
          ) : null}
        </nav>
        <div className="mt-8 space-y-2">
          <Button variant="soft" size="sm" className="w-full rounded-full" asChild>
            <Link to="/app">Vue athlète</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleSignOut}>
            Deconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between border-b border-border bg-background/90 px-4 pb-3 pt-safe-header backdrop-blur md:hidden">
          <BrandLogo compact />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="soft" size="sm" asChild>
              <Link to="/app">App</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <div className="mb-6 hidden items-center justify-end gap-2 md:flex">
            <ThemeToggle />
          </div>
          {!isCoach ? (
            <div className="mb-4 rounded-2xl border border-dashed border-border bg-soft-accent/40 p-6 text-sm text-muted-foreground">
              Espace coach — passez votre profil en role coach ou both dans{' '}
              <Link to="/app/profile" className="font-semibold text-primary">
                votre profil
              </Link>{' '}
              pour debloquer la gestion clients et programmes.
            </div>
          ) : null}
          <Outlet />
        </main>
        <CoachBottomNav showAdminNav={showAdminNav} />
      </div>
    </div>
  )
}
