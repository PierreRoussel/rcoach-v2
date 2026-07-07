import { Check, Crown } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/design-system/theme-provider'
import { themes, type ThemeId } from '@/design-system/themes'
import { useEntitlement } from '@/hooks/useSubscription'
import { isPremiumTheme } from '@/lib/subscription/entitlements'
import { cn } from '@/lib/utils'

export function ThemePicker() {
  const { themeId, setThemeId } = useTheme()
  const { entitled: hasPremiumThemes } = useEntitlement('premium_themes')

  function handleSelect(theme: ThemeId) {
    if (isPremiumTheme(theme) && !hasPremiumThemes) {
      return
    }
    setThemeId(theme)
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Object.values(themes).map((theme) => {
        const isSelected = themeId === theme.id
        const isLocked = isPremiumTheme(theme.id) && !hasPremiumThemes

        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => handleSelect(theme.id)}
            aria-pressed={isSelected}
            className={cn(
              'relative rounded-2xl border p-3 text-left transition-colors',
              isSelected
                ? 'border-primary bg-soft-primary/40 ring-2 ring-primary/25'
                : 'border-border bg-card hover:border-primary/30',
              isLocked && 'opacity-90',
            )}
          >
            {isLocked ? (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                <Crown className="size-3" aria-hidden />
                Premium
              </span>
            ) : null}

            <div
              className="mb-3 overflow-hidden rounded-xl border border-border/60"
              style={{ backgroundColor: theme.preview.background }}
            >
              <div className="flex h-12 items-end gap-1.5 p-2">
                <span
                  className="h-7 flex-1 rounded-md"
                  style={{ backgroundColor: theme.preview.primary }}
                />
                <span
                  className="h-5 w-1/3 rounded-md"
                  style={{ backgroundColor: theme.preview.secondary }}
                />
                <span
                  className="size-5 rounded-full"
                  style={{ backgroundColor: theme.preview.accent }}
                />
              </div>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-foreground">{theme.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {theme.description}
                </p>
              </div>
              {isSelected ? (
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" aria-hidden />
                </span>
              ) : null}
            </div>

            {isLocked ? (
              <Button variant="soft" size="sm" className="mt-3 w-full" asChild>
                <Link to="/app/premium" onClick={(event) => event.stopPropagation()}>
                  Débloquer le thème Pro
                </Link>
              </Button>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export type { ThemeId }
