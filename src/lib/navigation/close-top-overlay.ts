/** Closes the topmost open drawer, dialog, or menu via Escape (Vaul/Radix). */
export function closeTopOverlayLayer(): boolean {
  const openDrawer = document.querySelector('[data-vaul-drawer][data-state="open"]')
  if (openDrawer) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    return true
  }

  const openDialog = document.querySelector('[role="dialog"][data-state="open"]')
  if (openDialog) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    return true
  }

  const openMenu = document.querySelector('[role="menu"][data-state="open"]')
  if (openMenu) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    return true
  }

  return false
}
