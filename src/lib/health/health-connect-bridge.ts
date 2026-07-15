import { Capacitor } from '@capacitor/core'
import { HealthConnect } from '@rcoach/capacitor-health-connect'

import type { HealthConnectAvailability, HeartRateSummary } from '@rcoach/capacitor-health-connect'

function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export async function isHealthConnectBridgeSupported() {
  if (!isAndroidNative()) {
    return false
  }

  try {
    const result = await HealthConnect.isAvailable()
    return result.status === 'Available'
  } catch {
    return false
  }
}

export async function getHealthConnectAvailability(): Promise<HealthConnectAvailability | null> {
  if (!isAndroidNative()) {
    return null
  }

  try {
    const result = await HealthConnect.isAvailable()
    return result.status
  } catch {
    return null
  }
}

export async function getHealthConnectPermissionStatus() {
  if (!isAndroidNative()) {
    return { granted: false, available: false }
  }

  try {
    const availability = await HealthConnect.isAvailable()
    if (availability.status !== 'Available') {
      return { granted: false, available: false, status: availability.status }
    }

    const permissions = await HealthConnect.getPermissionStatus()
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
  if (!isAndroidNative()) {
    return { granted: false }
  }

  return HealthConnect.requestHealthPermissions()
}

export async function writeHealthConnectExerciseSession(options: {
  clientRecordId: string
  title: string
  startTime: string
  endTime: string
  exerciseType?: 'STRENGTH_TRAINING'
}) {
  if (!isAndroidNative()) {
    throw new Error('Health Connect is not available on this platform')
  }

  await HealthConnect.writeExerciseSession(options)
}

export async function readHeartRateSummaryFromBridge(
  startTime: string,
  endTime: string,
): Promise<HeartRateSummary> {
  if (!isAndroidNative()) {
    return { sampleCount: 0 }
  }

  try {
    return await HealthConnect.readHeartRateSummary({ startTime, endTime })
  } catch {
    return { sampleCount: 0 }
  }
}

export async function openHealthConnectSettings() {
  if (!isAndroidNative()) {
    return
  }

  await HealthConnect.openHealthConnectSettings()
}
