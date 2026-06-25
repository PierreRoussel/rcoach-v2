const MAIN_TAB_PATTERNS = [
  /^\/app\/?$/,
  /^\/app\/sessions\/?$/,
  /^\/app\/stats\/?$/,
  /^\/app\/profile\/?$/,
] as const

export function getMainTabIndex(pathname: string): number | null {
  const normalized = pathname.split('?')[0] ?? pathname

  for (let index = 0; index < MAIN_TAB_PATTERNS.length; index++) {
    if (MAIN_TAB_PATTERNS[index].test(normalized)) {
      return index
    }
  }

  return null
}

export function resolveViewTransitionTypes(
  fromPathname: string | undefined,
  toPathname: string,
): string[] {
  const fromIndex = fromPathname ? getMainTabIndex(fromPathname) : null
  const toIndex = getMainTabIndex(toPathname)

  if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
    const direction = fromIndex > toIndex ? 'right' : 'left'
    return [`slide-${direction}`]
  }

  return ['fade']
}
