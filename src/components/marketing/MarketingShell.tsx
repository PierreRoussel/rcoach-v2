import { Link } from '@tanstack/react-router'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/design-system'
import { LegalLinksRow } from '@/components/legal/LegalLinksRow'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { MARKETING_HEADER_NAV, MARKETING_NAV } from '@/lib/seo/site'
import { cn } from '@/lib/utils'

type MarketingShellProps = {
  children: React.ReactNode
  className?: string
}

export function MarketingShell({ children, className }: MarketingShellProps) {
  const { isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const previousTheme = root.dataset.theme
    const hadDark = root.classList.contains('dark')

    root.dataset.theme = 'sports-candy'
    root.classList.remove('dark')

    return () => {
      if (previousTheme) {
        root.dataset.theme = previousTheme
      } else {
        delete root.dataset.theme
      }
      if (hadDark) {
        root.classList.add('dark')
      }
    }
  }, [])

  return (
    <div className={cn('min-h-svh bg-background text-foreground', className)}>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
          <Link to="/" className="shrink-0 justify-self-start" onClick={() => setMobileOpen(false)}>
            <BrandLogo />
          </Link>

          <nav
            className="hidden items-center justify-center gap-1 md:flex"
            aria-label="Navigation principale"
          >
            {MARKETING_HEADER_NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={'hash' in item ? item.hash : undefined}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-self-end md:flex">
            {isAuthenticated ? (
              <Button variant="soft" size="sm" className="rounded-full" asChild>
                <Link to="/app">Ouvrir l’app</Link>
              </Button>
            ) : (
              <Button variant="pill" size="sm" className="rounded-full px-4" asChild>
                <Link to="/auth/register">
                  Essai gratuit
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            )}
          </div>

          <button
            type="button"
            className="col-start-3 inline-flex size-10 items-center justify-center justify-self-end rounded-xl border border-border md:hidden"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border/70 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
              {MARKETING_HEADER_NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  hash={'hash' in item ? item.hash : undefined}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/60"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              {isAuthenticated ? (
                <Button variant="soft" className="w-full rounded-xl" asChild>
                  <Link to="/app" onClick={() => setMobileOpen(false)}>
                    Ouvrir l’app
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="pill" className="w-full rounded-xl" asChild>
                    <Link to="/auth/register" onClick={() => setMobileOpen(false)}>
                      Essai gratuit
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl" asChild>
                    <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                      Connexion
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="mt-16 border-t border-border/70 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <BrandLogo />
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                L’application qui réunit musculation, nutrition et motivation pour les sportifs
                ambitieux.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-3">
              <div>
                <p className="font-display font-black">Produit</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  {MARKETING_NAV.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className="hover:text-foreground">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-display font-black">Compte</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li>
                    <Link to="/auth/register" className="hover:text-foreground">
                      Créer un compte
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth/login" className="hover:text-foreground">
                      Connexion
                    </Link>
                  </li>
                  <li>
                    <Link to="/app" className="hover:text-foreground">
                      Application
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-display font-black">Aide</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li>
                    <Link to="/help" className="hover:text-foreground">
                      Centre d’aide
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="hover:text-foreground">
                      À propos
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border/60 pt-6">
            <LegalLinksRow className="justify-center md:justify-start" />
          </div>
        </div>
      </footer>
    </div>
  )
}
