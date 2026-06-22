export function buildWorkoutShareUrl(shareToken: string) {
  return `${window.location.origin}/share/workout/${shareToken}`
}
