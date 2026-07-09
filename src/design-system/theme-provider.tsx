import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  defaultThemeId,
  themeIds,
  themes,
  themeSupportsColorModePreference,
  type ThemeId,
} from '@/design-system/themes'
import { syncPwaChromeColor } from '@/lib/pwa/sync-pwa-chrome-color'

export type ColorModePreference = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'

type ThemeContextValue = {
  themeId: ThemeId
  colorModePreference: ColorModePreference
  colorMode: ResolvedColorMode
  setThemeId: (themeId: ThemeId) => void
  setColorModePreference: (mode: ColorModePreference) => void
  setColorMode: (mode: ResolvedColorMode) => void
  toggleColorMode: () => void
  availableThemes: typeof themes
}

const STORAGE_KEY = 'rcoach-theme'

type StoredThemePreferences = {
  themeId: ThemeId
  colorModePreference: ColorModePreference
}

function resolveColorMode(preference: ColorModePreference): ResolvedColorMode {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  return preference
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreferences(): StoredThemePreferences {
  if (typeof window === 'undefined') {
    return { themeId: defaultThemeId, colorModePreference: 'light' }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { themeId: defaultThemeId, colorModePreference: 'light' }
    }

    const parsed = JSON.parse(raw) as Partial<
      StoredThemePreferences & { colorMode?: ResolvedColorMode }
    >
    const themeId =
      parsed.themeId && themeIds.includes(parsed.themeId)
        ? parsed.themeId
        : defaultThemeId

    const legacyColorMode = parsed.colorMode
    const colorModePreference =
      parsed.colorModePreference === 'dark' ||
      parsed.colorModePreference === 'system'
        ? parsed.colorModePreference
        : legacyColorMode === 'dark'
          ? 'dark'
          : 'light'

    return { themeId, colorModePreference }
  } catch {
    return { themeId: defaultThemeId, colorModePreference: 'light' }
  }
}

function applyThemeToDocument(themeId: ThemeId, colorMode: ResolvedColorMode) {
  const root = document.documentElement
  root.dataset.theme = themeId
  root.classList.toggle('dark', colorMode === 'dark')
  root.style.colorScheme = colorMode
  syncPwaChromeColor(colorMode)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StoredThemePreferences>(
    readStoredPreferences,
  )
  const [resolvedColorMode, setResolvedColorMode] = useState<ResolvedColorMode>(
    () => resolveColorMode(preferences.colorModePreference),
  )

  useEffect(() => {
    const nextColorMode = resolveColorMode(preferences.colorModePreference)
    setResolvedColorMode(nextColorMode)
    applyThemeToDocument(preferences.themeId, nextColorMode)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))

    if (preferences.colorModePreference !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const systemColorMode = resolveColorMode('system')
      setResolvedColorMode(systemColorMode)
      applyThemeToDocument(preferences.themeId, systemColorMode)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [preferences])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: preferences.themeId,
      colorModePreference: preferences.colorModePreference,
      colorMode: resolvedColorMode,
      setThemeId: (themeId) => {
        setPreferences((current) => ({
          ...current,
          themeId,
          ...(themes[themeId].defaultColorModePreference
            ? { colorModePreference: themes[themeId].defaultColorModePreference! }
            : {}),
        }))
      },
      setColorModePreference: (colorModePreference) => {
        if (!themeSupportsColorModePreference(preferences.themeId)) {
          return
        }

        setPreferences((current) => ({ ...current, colorModePreference }))
      },
      setColorMode: (colorMode) => {
        if (!themeSupportsColorModePreference(preferences.themeId)) {
          return
        }

        setPreferences((current) => ({ ...current, colorModePreference: colorMode }))
      },
      toggleColorMode: () => {
        if (!themeSupportsColorModePreference(preferences.themeId)) {
          return
        }

        setPreferences((current) => ({
          ...current,
          colorModePreference:
            resolvedColorMode === 'dark' ? 'light' : 'dark',
        }))
      },
      availableThemes: themes,
    }),
    [preferences, resolvedColorMode],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
