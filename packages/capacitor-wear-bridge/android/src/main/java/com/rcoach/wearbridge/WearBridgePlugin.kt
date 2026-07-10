package com.rcoach.wearbridge

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
        detectWatchStatus { available, paired, hasRcoachWear ->
            val result = JSObject()
            result.put("available", available)
            result.put("paired", paired)
            result.put("hasRcoachWear", hasRcoachWear)
            call.resolve(result)
        }
    }

    private fun detectWatchStatus(
        callback: (available: Boolean, paired: Boolean, hasRcoachWear: Boolean) -> Unit,
    ) {
        val capabilityClient = Wearable.getCapabilityClient(context)
        val nodeClient = Wearable.getNodeClient(context)

        nodeClient.connectedNodes
            .addOnSuccessListener { nodes ->
                val paired = nodes.isNotEmpty()
                if (!paired) {
                    callback(false, false, false)
                    return@addOnSuccessListener
                }

                capabilityClient
                    .getCapability(WATCH_CAPABILITY, CapabilityClient.FILTER_ALL)
                    .addOnSuccessListener { capabilityInfo ->
                        val hasRcoachWear = capabilityInfo.nodes.isNotEmpty()
                        callback(hasRcoachWear || paired, paired, hasRcoachWear)
                    }
                    .addOnFailureListener {
                        callback(paired, paired, false)
                    }
            }
            .addOnFailureListener {
                callback(false, false, false)
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
