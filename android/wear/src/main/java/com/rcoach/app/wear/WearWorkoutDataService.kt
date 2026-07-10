package com.rcoach.app.wear

import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

class WearWorkoutDataService : WearableListenerService() {
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        for (event in dataEvents) {
            if (event.type != DataEvent.TYPE_CHANGED) {
                continue
            }

            if (event.dataItem.uri.path != WORKOUT_SNAPSHOT_PATH) {
                continue
            }

            val snapshotJson = DataMapItem.fromDataItem(event.dataItem).dataMap
                .getString("snapshotJson")
                ?: continue

            WearSessionBridge.emitSnapshot(JSONObject(snapshotJson))
        }
    }

    companion object {
        const val WORKOUT_SNAPSHOT_PATH = "/rcoach/workout_snapshot"
    }
}
