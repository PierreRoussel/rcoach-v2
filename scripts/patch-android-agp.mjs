#!/usr/bin/env node
/**
 * Aligns Capacitor-generated Gradle files with android/build.gradle (AGP 8.9.1 / JDK 17).
 * Re-run after `npm install` or `cap sync android`.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const targetAgp = '8.9.1'

function collectGradleFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      collectGradleFiles(fullPath, files)
      continue
    }

    if (entry === 'build.gradle' || entry === 'capacitor.build.gradle') {
      files.push(fullPath)
    }
  }

  return files
}

function getGradleFiles() {
  const files = new Set([
    ...collectGradleFiles(path.join(root, 'node_modules/@capacitor')),
    ...collectGradleFiles(path.join(root, 'node_modules/@capacitor-mlkit')),
    path.join(root, 'android/capacitor-cordova-android-plugins/build.gradle'),
    path.join(root, 'android/app/capacitor.build.gradle'),
  ])

  return [...files].filter((file) => existsSync(file))
}

function patchAgp(file) {
  const content = readFileSync(file, 'utf8')
  const patched = content.replace(
    /classpath 'com\.android\.tools\.build:gradle:[^']+'/g,
    `classpath 'com.android.tools.build:gradle:${targetAgp}'`,
  )

  if (patched === content) {
    return false
  }

  writeFileSync(file, patched)
  console.log(`patch-android-agp: ${path.relative(root, file)} → AGP ${targetAgp}`)
  return true
}

function patchJavaVersion(file) {
  const content = readFileSync(file, 'utf8')
  const patched = content
    .replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17')
    .replace(/jvmTarget = '21'/g, "jvmTarget = '17'")
    .replace(/sourceCompatibility JavaVersion\.VERSION_21/g, 'sourceCompatibility JavaVersion.VERSION_17')
    .replace(/targetCompatibility JavaVersion\.VERSION_21/g, 'targetCompatibility JavaVersion.VERSION_17')

  if (patched === content) {
    return false
  }

  writeFileSync(file, patched)
  console.log(`patch-android-agp: ${path.relative(root, file)} → Java 17`)
  return true
}

for (const file of getGradleFiles()) {
  patchAgp(file)
  patchJavaVersion(file)
}
