import type { Plugin } from 'vite'

const ANDROID_SHELL_ENTRY_SCRIPT = `
;(function redirectAndroidShellEntry() {
  document.documentElement.classList.add('capacitor-native')
  var path = location.pathname
  if (path === '/' || path === '/index.html') {
    location.replace('/app' + location.search + location.hash)
  }
})()
`.trim()

export function androidShellHtmlPlugin(): Plugin {
  return {
    name: 'rcoach-android-shell-html',
    transformIndexHtml(html) {
      const script = `<script>${ANDROID_SHELL_ENTRY_SCRIPT}</script>`
      return html.replace('<head>', `<head>\n    ${script}`)
    },
  }
}
