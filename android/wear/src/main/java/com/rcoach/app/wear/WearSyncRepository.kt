package com.rcoach.app.wear

import android.content.Context
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.tasks.await
import org.json.JSONObject

class WearSyncRepository(context: Context) : DataClient.OnDataChangedListener {
    private val appContext = context.applicationContext
    private val dataClient = Wearable.getDataClient(appContext)
    private val messageClient = Wearable.getMessageClient(appContext)

    var onSnapshot: ((JSONObject) -> Unit)? = null

    fun start() {
        dataClient.addListener(this)
    }

    fun stop() {
        dataClient.removeListener(this)
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        for (event in dataEvents) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            if (event.dataItem.uri.path != "/rcoach/workout_snapshot") continue

            val map = DataMapItem.fromDataItem(event.dataItem).dataMap
            val snapshotJson = map.getString("snapshotJson") ?: continue
            onSnapshot?.invoke(JSONObject(snapshotJson))
        }
    }

    suspend fun sendCommand(commandJson: String) {
        val nodes = Wearable.getNodeClient(appContext).connectedNodes.await()
        val node = nodes.firstOrNull() ?: return
        messageClient.sendMessage(node.id, "/rcoach/watch_command", commandJson.toByteArray()).await()
    }
}
