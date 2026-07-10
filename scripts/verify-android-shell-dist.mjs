#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const indexPath = path.join(root, 'dist', 'index.html')

function fail(message) {
  console.error(`ÉCHEC : ${message}`)
  console.error(
    'Lancez « npm run build:android » (mode android) avant « cap sync » — pas un build web/PWA.',
  )
  process.exit(1)
}

function main() {
  let html

  try {
    html = readFileSync(indexPath, 'utf8')
  } catch {
    fail(`fichier introuvable : ${indexPath}`)
  }

  if (!html.includes('redirectAndroidShellEntry')) {
    fail('dist/index.html ne contient pas le script redirectAndroidShellEntry (build shell Android attendu).')
  }

  if (html.includes('vite-plugin-pwa:register-sw') || html.includes('/registerSW.js')) {
    fail('dist/index.html contient le service worker PWA — build web détecté, pas le build Android.')
  }

  console.log('OK : dist/index.html est un build shell Android valide.')
}

main()
