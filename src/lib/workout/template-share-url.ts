export function buildTemplateShareUrl(shareToken: string) {
  return `${window.location.origin}/share/template/${shareToken}`
}
