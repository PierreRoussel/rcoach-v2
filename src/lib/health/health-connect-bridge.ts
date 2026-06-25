import { Capacitor } from '@capacitor/core'

import type { HealthConnectAvailability, HeartRateSummary } from '@rcoach/capacitor-health-connect'

type HealthConnectPluginLike = {
  isAvailable(): Promise<{ status: HealthConnectAvailability }>
  getPermissionStatus(): Promise<{ granted: boolean }>
  requestHealthPermissions(): Promise<{ granted: boolean }>
  writeExerciseSession(options: {
    clientRecordId: string
    title: string
    startTime: string
    endTime: string
    exerciseType?: 'STRENGTH_TRAINING'
  }): Promise<void>
  readHeartRateSummary(options: {
    startTime: string
    endTime: string
  }): Promise<HeartRateSummary>
  openHealthConnectSettings(): Promise<void>
}

let cachedPlugin: HealthConnectPluginLike | null | undefined

async function loadHealthConnectPlugin(): Promise<HealthConnectPluginLike | null> {
  if (cachedPlugin !== undefined) {
    return cachedPlugin
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    cachedPlugin = null
    return cachedPlugin
  }

  try {
    const module = await import('@rcoach/capacitor-health-connect')
    cachedPlugin = module.HealthConnect as HealthConnectPluginLike
  } catch {
    cachedPlugin = null
  }

  return cachedPlugin
}

export async function isHealthConnectBridgeSupported() {
  const plugin = await loadHealthConnectPlugin()
  if (!plugin) {
    return false
  }

  try {
    const result = await plugin.isAvailable()
    return result.status === 'Available'
  } catch {
    return false
  }
}

export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability | null> {
  const plugin = await loadHealthConnectPlugin()
  if (!plugin) {
    return null
  }

  try {
    const result = await plugin.isAvailable()
    return result.status
  } catch {
    return null
  }
}

export async function getHealthConnectPermissionStatus() {
  const plugin = await loadHealthConnectPlugin()
  if (!plugin) {
    return { granted: false, available: false }
  }

  try {
    const availability = await plugin.isAvailable()
    if (availability.status !== 'Available') {
      return { granted: false, available: false, status: availability.status }
    }

    const permissions = await plugin.getPermissionStatus()
    return {
      granted: permissions.granted,
      available: true,
      status: availability.status,
    }
  } catch {
    return { granted: false, available: false }
  }
}

export async function requestHealthConnectPermissions() {
  const plugin = await loadHealthConnectPlugin()
  if (!plugin) {
    return { granted: false }
  }

  return plugin.requestHealthPermissions()
}

export async function writeHealthConnectExerciseSession(options: {
  clientRecordId: string
  title: string
  startTime: string
  endTime: string
  exerciseType?: 'STRENGTH_TRAINING'
}) {
  const plugin = await loadHealthConnectPlugin()
  if (!plugin) {
    throw new Error('Health Connect is not available on this platform')
  }

  await plugin.writeExerciseSession(options)
}

export async function readHeartRateSummaryFromBridge(
  startTime: string,
  endTime: string,
): Promise<HeartRateSummary> {
  const plugin = await loadHealthConnectPlugin()
  if (!plugin) {
    return { sampleCount: 0 }
  }

  try {
    return await plugin.readHeartRateSummary({ startTime, endTime })
  } catch {
    return { sampleCount: 0 }
  }
}

export async function openHealthConnectSettings() {
  const plugin = await loadHealthConnectPlugin()
  if (!plugin) {
    return
  }

  await plugin.openHealthConnectSettings()
}
