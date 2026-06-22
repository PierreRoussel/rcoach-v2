/** Radix overlays can leave the page unclickable after interrupted pointer flows (e.g. dnd-kit). */
export function restorePointerInteraction() {
  const reset = () => {
    document.body.style.pointerEvents = ''
    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('touch-action')
    document.body.style.removeProperty('cursor')
    document.body.removeAttribute('data-scroll-locked')
  }

  reset()
  requestAnimationFrame(reset)
}
