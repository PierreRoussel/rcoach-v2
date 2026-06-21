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
  type ThemeId,
} from '@/design-system/themes'

type ColorMode = 'light' | 'dark'

type ThemeContextValue = {
  themeId: ThemeId
  colorMode: ColorMode
  setThemeId: (themeId: ThemeId) => void
  setColorMode: (mode: ColorMode) => void
  toggleColorMode: () => void
  availableThemes: typeof themes
}

const STORAGE_KEY = 'rcoach-theme'

type StoredThemePreferences = {
  themeId: ThemeId
  colorMode: ColorMode
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreferences(): StoredThemePreferences {
  if (typeof window === 'undefined') {
    return { themeId: defaultThemeId, colorMode: 'light' }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { themeId: defaultThemeId, colorMode: 'light' }
    }

    const parsed = JSON.parse(raw) as Partial<StoredThemePreferences>
    const themeId =
      parsed.themeId && themeIds.includes(parsed.themeId)
        ? parsed.themeId
        : defaultThemeId
    const colorMode = parsed.colorMode === 'dark' ? 'dark' : 'light'

    return { themeId, colorMode }
  } catch {
    return { themeId: defaultThemeId, colorMode: 'light' }
  }
}

function applyThemeToDocument(themeId: ThemeId, colorMode: ColorMode) {
  const root = document.documentElement
  root.dataset.theme = themeId
  root.classList.toggle('dark', colorMode === 'dark')
  root.style.colorScheme = colorMode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StoredThemePreferences>(
    readStoredPreferences,
  )

  useEffect(() => {
    applyThemeToDocument(preferences.themeId, preferences.colorMode)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId: preferences.themeId,
      colorMode: preferences.colorMode,
      setThemeId: (themeId) => {
        setPreferences((current) => ({ ...current, themeId }))
      },
      setColorMode: (colorMode) => {
        setPreferences((current) => ({ ...current, colorMode }))
      },
      toggleColorMode: () => {
        setPreferences((current) => ({
          ...current,
          colorMode: current.colorMode === 'dark' ? 'light' : 'dark',
        }))
      },
      availableThemes: themes,
    }),
    [preferences],
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
