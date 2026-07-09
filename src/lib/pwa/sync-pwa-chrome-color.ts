import type { ResolvedColorMode } from '@/design-system/theme-provider'

const THEME_COLOR_META = 'meta[name="theme-color"]'
const APPLE_STATUS_BAR_META = 'meta[name="apple-mobile-web-app-status-bar-style"]'

function readBackgroundColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
}

function setMetaContent(selector: string, content: string) {
  const meta = document.querySelector(selector)
  if (meta) {
    meta.setAttribute('content', content)
  }
}

export function syncPwaChromeColor(colorMode: ResolvedColorMode) {
  if (typeof document === 'undefined') {
    return
  }

  const background = readBackgroundColor()
  if (!background) {
    return
  }

  setMetaContent(THEME_COLOR_META, background)
  setMetaContent(
    APPLE_STATUS_BAR_META,
    colorMode === 'dark' ? 'black-translucent' : 'default',
  )
}
