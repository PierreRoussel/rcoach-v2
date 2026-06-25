import { readHeartRateSummaryFromBridge } from '@/lib/health/health-connect-bridge'
import { isHealthConnectSyncEnabled } from '@/lib/health/health-connect-preferences'

export type HeartRateRecap = {
  avgBpm: number
  maxBpm: number
  sampleCount: number
}

export async function readHeartRateSummary(
  startTime: string,
  endTime: string,
): Promise<HeartRateRecap | null> {
  if (!isHealthConnectSyncEnabled()) {
    return null
  }

  const summary = await readHeartRateSummaryFromBridge(startTime, endTime)
  if (summary.sampleCount <= 0 || summary.avgBpm == null || summary.maxBpm == null) {
    return null
  }

  return {
    avgBpm: summary.avgBpm,
    maxBpm: summary.maxBpm,
    sampleCount: summary.sampleCount,
  }
}
