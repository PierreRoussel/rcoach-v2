package com.rcoach.wearbridge

import android.net.Uri
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.wearable.Node
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

@CapacitorPlugin(name = "WearBridge")
class WearBridgePlugin : Plugin() {

    override fun load() {
        super.load()
        WearBridgePluginHolder.plugin = this
    }

    override fun handleOnDestroy() {
        WearBridgePluginHolder.plugin = null
        super.handleOnDestroy()
    }

    @PluginMethod
    fun isWatchAvailable(call: PluginCall) {
        val nodeClient = Wearable.getNodeClient(context)
        nodeClient.connectedNodes
            .addOnSuccessListener { nodes: List<Node> ->
                val result = JSObject()
                result.put("available", nodes.isNotEmpty())
                call.resolve(result)
            }
            .addOnFailureListener { error ->
                call.reject(error.message ?: "Unable to detect watch nodes")
            }
    }

    @PluginMethod
    fun publishSnapshot(call: PluginCall) {
        val snapshotJson = call.getString("snapshotJson")
        if (snapshotJson.isNullOrBlank()) {
            call.reject("snapshotJson is required")
            return
        }

        val request = PutDataMapRequest.create("/rcoach/workout_snapshot")
        request.dataMap.putString("snapshotJson", snapshotJson)
        request.dataMap.putLong("updatedAt", System.currentTimeMillis())

        Wearable.getDataClient(context)
            .putDataItem(request.asPutDataRequest().setUrgent())
            .addOnSuccessListener { call.resolve() }
            .addOnFailureListener { error ->
                call.reject(error.message ?: "Unable to publish snapshot")
            }
    }

    fun emitWatchCommand(commandJson: String) {
        val payload = JSObject()
        payload.put("commandJson", commandJson)
        notifyListeners("watchCommand", payload)
    }
}
