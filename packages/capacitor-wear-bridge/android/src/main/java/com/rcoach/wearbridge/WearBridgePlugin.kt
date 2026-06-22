package com.rcoach.wearbridge

import android.net.Uri
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.wearable.CapabilityClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

@CapacitorPlugin(name = "WearBridge")
class WearBridgePlugin : Plugin() {

    companion object {
        private const val WATCH_CAPABILITY = "rcoach_wear"
    }

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
        detectWatchAvailable { available ->
            val result = JSObject()
            result.put("available", available)
            call.resolve(result)
        }
    }

    private fun detectWatchAvailable(callback: (Boolean) -> Unit) {
        val capabilityClient = Wearable.getCapabilityClient(context)
        capabilityClient
            .getCapability(WATCH_CAPABILITY, CapabilityClient.FILTER_REACHABLE)
            .addOnSuccessListener { capabilityInfo ->
                if (capabilityInfo.nodes.isNotEmpty()) {
                    callback(true)
                    return@addOnSuccessListener
                }

                capabilityClient
                    .getCapability(WATCH_CAPABILITY, CapabilityClient.FILTER_ALL)
                    .addOnSuccessListener { allCapabilityInfo ->
                        if (allCapabilityInfo.nodes.isNotEmpty()) {
                            callback(true)
                            return@addOnSuccessListener
                        }

                        fallbackConnectedNodes(callback)
                    }
                    .addOnFailureListener { fallbackConnectedNodes(callback) }
            }
            .addOnFailureListener { fallbackConnectedNodes(callback) }
    }

    private fun fallbackConnectedNodes(callback: (Boolean) -> Unit) {
        Wearable.getNodeClient(context)
            .connectedNodes
            .addOnSuccessListener { nodes -> callback(nodes.isNotEmpty()) }
            .addOnFailureListener { callback(false) }
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
