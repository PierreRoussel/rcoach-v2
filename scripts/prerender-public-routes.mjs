import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

import { listPublicPrerenderPaths } from './lib/public-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const previewPort = Number(process.env.PRERENDER_PORT ?? 4173)
const previewOrigin = `http://127.0.0.1:${previewPort}`

function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now()

  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => {
        response.resume()
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve(undefined)
          return
        }
        retry()
      })

      request.on('error', retry)

      function retry() {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Preview server not ready at ${url}`))
          return
        }
        setTimeout(tick, 400)
      }
    }

    tick()
  })
}

function startPreview() {
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
      shell: process.platform === 'win32',
    },
  )

  return child
}

function routeToOutputFile(routePath) {
  if (routePath === '/') {
    return path.join(distDir, 'index.html')
  }

  const normalized = routePath.replace(/^\//, '').replace(/\/$/, '')
  return path.join(distDir, normalized, 'index.html')
}

async function prerenderRoute(browser, routePath) {
  const page = await browser.newPage()
  const url = routePath === '/' ? `${previewOrigin}/` : `${previewOrigin}${routePath}`

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
  await page.waitForFunction(
    () => {
      const root = document.querySelector('#root')
      return Boolean(root && root.children.length > 0 && root.textContent?.trim())
    },
    { timeout: 30_000 },
  )

  const html = await page.content()
  const outputFile = routeToOutputFile(routePath)
  fs.mkdirSync(path.dirname(outputFile), { recursive: true })
  fs.writeFileSync(outputFile, html, 'utf8')
  await page.close()

  console.log(`Prerendered ${routePath} -> ${path.relative(distDir, outputFile)}`)
}

async function main() {
  if (!fs.existsSync(distDir)) {
    throw new Error('dist/ not found. Run vite build first.')
  }

  const routes = listPublicPrerenderPaths()
  let preview = null
  let startedPreview = false

  try {
    await waitForServer(`${previewOrigin}/`)
  } catch {
    preview = startPreview()
    startedPreview = true
    await waitForServer(`${previewOrigin}/`)
  }

  try {
    const browser = await chromium.launch({ headless: true })

    try {
      for (const routePath of routes) {
        await prerenderRoute(browser, routePath)
      }
    } finally {
      await browser.close()
    }

    console.log(`Prerendered ${routes.length} public routes.`)
  } finally {
    if (startedPreview && preview) {
      preview.kill('SIGTERM')
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
