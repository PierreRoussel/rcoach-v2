#!/usr/bin/env node
/**
 * Aligns Capacitor-generated Gradle files with android/build.gradle (AGP 8.2.2 / JDK 17).
 * Re-run after `npm install` or `cap sync android`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const targetAgp = '8.2.2'

const agpFiles = [
  path.join(root, 'node_modules/@capacitor/android/capacitor/build.gradle'),
  path.join(root, 'android/capacitor-cordova-android-plugins/build.gradle'),
]

function patchAgp(file) {
  if (!existsSync(file)) {
    return false
  }

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
  if (!existsSync(file)) {
    return false
  }

  const content = readFileSync(file, 'utf8')
  const patched = content
    .replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17')
    .replace(/jvmTarget = '21'/g, "jvmTarget = '17'")

  if (patched === content) {
    return false
  }

  writeFileSync(file, patched)
  console.log(`patch-android-agp: ${path.relative(root, file)} → Java 17`)
  return true
}

for (const file of agpFiles) {
  patchAgp(file)
}

const javaFiles = [
  path.join(root, 'node_modules/@capacitor/android/capacitor/build.gradle'),
  path.join(root, 'android/capacitor-cordova-android-plugins/build.gradle'),
  path.join(root, 'android/app/capacitor.build.gradle'),
]

for (const file of javaFiles) {
  patchJavaVersion(file)
}
