#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const routeTreePath = path.join(root, 'src', 'routeTree.gen.ts')
const expectedRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/app',
  '/app/',
  '/app/stats',
  '/app/profile',
  '/app/workouts',
  '/app/workout/active',
  '/app/import',
  '/coach',
  '/coach/',
]

function readRouteTree() {
  const content = readFileSync(routeTreePath, 'utf8')
  const matches = [...content.matchAll(/'([^']+)': typeof/g)]
  return matches.map((match) => match[1])
}

function waitForServer(url, attempts = 30) {
  return new Promise((resolve, reject) => {
    let tries = 0

    const tick = async () => {
      tries += 1

      try {
        const response = await fetch(url)
        if (response.ok) {
          resolve(undefined)
          return
        }
      } catch {
        // retry
      }

      if (tries >= attempts) {
        reject(new Error(`Server not ready at ${url}`))
        return
      }

      setTimeout(tick, 500)
    }

    tick()
  })
}

async function checkRoutes(baseUrl, routes) {
  const failures = []

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`)
    if (!response.ok) {
      failures.push(`${route} -> HTTP ${response.status}`)
    }
  }

  return failures
}

async function main() {
  const routesInTree = readRouteTree()
  const missingFromTree = expectedRoutes.filter(
    (route) => !routesInTree.includes(route),
  )

  if (missingFromTree.length > 0) {
    console.error('FAIL: Missing routes in routeTree.gen.ts:')
    for (const route of missingFromTree) {
      console.error(`  - ${route}`)
    }
    process.exit(1)
  }

  console.log(`OK: ${expectedRoutes.length} routes registered in TanStack Router.`)

  const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: root,
    stdio: 'ignore',
    shell: true,
  })

  try {
    const baseUrl = 'http://127.0.0.1:4173'
    await waitForServer(baseUrl)
    const failures = await checkRoutes(baseUrl, expectedRoutes)

    if (failures.length > 0) {
      console.error('FAIL: Route HTTP checks failed:')
      for (const failure of failures) {
        console.error(`  - ${failure}`)
      }
      process.exit(1)
    }

    console.log('OK: All routes respond with HTTP 200 via preview server.')
  } finally {
    preview.kill('SIGTERM')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
